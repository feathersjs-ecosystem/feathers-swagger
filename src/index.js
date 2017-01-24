import path from 'path';
import url from 'url';
import serveStatic from 'serve-static';
import * as utils from './utils';

export default function init (config) {
  return function () {
    const app = this;

    // Apply configuration
    const rootDoc = Object.assign({
      paths: {},
      definitions: {},
      swagger: '2.0',
      schemes: ['http'],
      tags: [],
      basePath: '',
      docsPath: '/docs',
      consumes: ['application/json'],
      produces: ['application/json'],
      info: {},
      ignore: {
        tags: []
      }
    }, config || {});

    const docsPath = rootDoc.docsPath;

    // Create API for Documentation
    app.get(docsPath, function (req, res) {
      res.format({
        'application/json': function () {
          res.json(rootDoc);
        },

        'text/html': function () {
          const parsed = url.parse(req.url);
          const pathname = parsed.pathname;

          if (pathname[pathname.length - 1] !== '/') {
            parsed.pathname = `${pathname}/`;
            return res.redirect(301, url.format(parsed));
          }

          if (typeof config.uiIndex === 'function') {
            config.uiIndex(req, res);
          } else if (typeof config.uiIndex === 'string') {
            res.sendFile(config.uiIndex);
          } else {
            res.json(rootDoc);
          }
        }
      });
    });

    if (typeof config.uiIndex !== 'undefined') {
      const uiPath = path.dirname(require.resolve('swagger-ui'));
      app.use(docsPath, serveStatic(uiPath));
    }

    app.docs = rootDoc;

    // Optional: Register this plugin as a Feathers provider
    app.providers.push(function (path, service) {
      service.docs = service.docs || {};

      // Load documentation from service, if available.
      const doc = service.docs;
      const group = path.split('/');
      const tag = path.indexOf('/') > -1 ? group[0] : path;
      const model = path.indexOf('/') > -1 ? group[1] : path;
      const security = {};

      if (rootDoc.security) {
        security[rootDoc.security.name] = [];
      }

      if (rootDoc.ignore.tags.indexOf(tag) > -1) {
        return;
      }

      const pathObj = rootDoc.paths;
      const idKey = service.id || 'id';
      const withIdKey = `/${path}/{${idKey}}`;
      const withoutIdKey = `/${path}`;
      const securities = doc.securities || [];

      if (typeof pathObj[withoutIdKey] === 'undefined') {
        pathObj[withoutIdKey] = {};
      }

      if (typeof pathObj[withIdKey] === 'undefined') {
        pathObj[withIdKey] = {};
      }

      if (typeof doc.definition !== 'undefined') {
        rootDoc.definitions[tag] = doc.definition;
      }

      if (typeof doc.definitions !== 'undefined') {
        rootDoc.definitions = Object.assign(rootDoc.definitions, doc.definitions);
      }

      // FIND
      if (typeof service.find === 'function') {
        pathObj[withoutIdKey].get = utils.operation('find', service, {
          tags: [tag],
          description: 'Retrieves a list of all resources from the service.',
          produces: rootDoc.produces,
          consumes: rootDoc.consumes,
          security: securities.indexOf('find') > -1 ? security : {}
        });
      }

      // GET
      if (typeof service.get === 'function') {
        pathObj[withIdKey].get = utils.operation('get', service, {
          tags: [tag],
          description: 'Retrieves a single resource with the given id from the service.',
          parameters: [{
            description: `ID of ${model} to return`,
            in: 'path',
            required: true,
            name: idKey,
            type: 'integer'
          }],
          responses: {
            '200': {
              description: 'success'
            }
          },
          produces: rootDoc.produces,
          consumes: rootDoc.consumes,
          security: securities.indexOf('get') > -1 ? security : {}
        });
      }

      // CREATE
      if (typeof service.create === 'function') {
        pathObj[withoutIdKey].post = utils.operation('create', service, {
          tags: [tag],
          description: 'Creates a new resource with data.',
          parameters: [{
            in: 'body',
            name: 'body',
            required: true,
            schema: {'$ref': '#/definitions/' + model}
          }],
          produces: rootDoc.produces,
          consumes: rootDoc.consumes,
          security: securities.indexOf('create') > -1 ? security : {}
        });
      }

      // UPDATE
      if (typeof service.update === 'function') {
        pathObj[withIdKey].put = utils.operation('update', service, {
          tags: [tag],
          description: 'Updates the resource identified by id using data.',
          parameters: [{
            description: 'ID of ' + model + ' to return',
            in: 'path',
            required: true,
            name: idKey,
            type: 'integer'
          }, {
            in: 'body',
            name: 'body',
            required: true,
            schema: {'$ref': '#/definitions/' + model}
          }],
          produces: rootDoc.produces,
          consumes: rootDoc.consumes,
          security: securities.indexOf('update') > -1 ? security : {}
        });
      }

      // PATCH
      if (typeof service.patch === 'function') {
        pathObj[withIdKey].patch = utils.operation('patch', service, {
          tags: [tag],
          description: 'Updates the resource identified by id using data.',
          parameters: [{
            description: 'ID of ' + model + ' to return',
            in: 'path',
            required: true,
            name: idKey,
            type: 'integer'
          }, {
            in: 'body',
            name: 'body',
            required: true,
            schema: {'$ref': '#/definitions/' + model}
          }],
          produces: rootDoc.produces,
          consumes: rootDoc.consumes,
          security: securities.indexOf('patch') > -1 ? security : {}
        });
      }

      // REMOVE
      if (typeof service.remove === 'function') {
        pathObj[withIdKey].delete = utils.operation('remove', service, {
          tags: [tag],
          description: 'Removes the resource with id.',
          parameters: [{
            description: 'ID of ' + model + ' to return',
            in: 'path',
            required: true,
            name: idKey,
            type: 'integer'
          }],
          produces: rootDoc.produces,
          consumes: rootDoc.consumes,
          security: securities.indexOf('remove') > -1 ? security : {}
        });
      }

      rootDoc.paths = pathObj;

      if (!rootDoc.tags.find(item => item.name === tag)) {
        rootDoc.tags.push(utils.tag(tag, doc));
      }
    });
  };
}

Object.assign(init, utils);
