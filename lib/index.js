const path = require('path');
const url = require('url');
const serveStatic = require('serve-static');
const utils = require('./utils');
const pick = require('lodash.pick');

// Find node_modules root path
let modulesRootPath = require.resolve('swagger-ui-dist');
modulesRootPath = modulesRootPath.substr(0, modulesRootPath.lastIndexOf('node_modules'));

const init = module.exports = function (config) {
  return function () {
    const app = this;

    // Whitelist root level properties in Swagger 2.0 spec
    // https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md
    const swaggerWhitelist = [
      'swagger', // required
      'info', // required
      'host',
      'basePath',
      'schemes',
      'consumes',
      'produces',
      'paths', // required
      'definitions',
      'parameters',
      'responses',
      'securityDefinitions',
      'security',
      'tags',
      'externalDocs'
    ];

    const whitelistConfig = pick(config, swaggerWhitelist);

    // Apply configuration with whitelist
    const rootDoc = Object.assign({
      swagger: '2.0',
      info: {},
      paths: {},
      // host: 'localhost',
      basePath: '/',
      schemes: [],
      consumes: [],
      produces: [],
      definitions: {},
      parameters: {},
      responses: {},
      securityDefinitions: {},
      security: [],
      tags: [],
      // externalDocs: {}
    }, whitelistConfig || {});

    const docsPath = config.docsPath;

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
            parsed.pathname = `${req.baseUrl}${pathname}/`;
            return res.redirect(301, url.format(parsed));
          }

          if (typeof config.uiIndex === 'function') {
            config.uiIndex(req, res);
          } else if (typeof config.uiIndex === 'string') {
            res.sendFile(config.uiIndex);
          } else if (config.uiIndex === true) {
            if (req.query.url) {
              res.sendFile(path.join(modulesRootPath, 'node_modules/swagger-ui-dist/index.html'));
            } else {
              // Set swagger url (needed for default UI)
              res.redirect('?url=' + encodeURI(config.docsPath));
            }
          } else {
            res.json(rootDoc);
          }
        }
      });
    });

    if (typeof config.uiIndex !== 'undefined') {
      const uiPath = path.dirname(require.resolve('swagger-ui-dist'));
      console.log('Adding static path', uiPath);
      app.use(docsPath, serveStatic(uiPath));
    }

    app.docs = rootDoc;

    const configurePlugin = function (service, path) {
      service.docs = service.docs || {};

      // Load documentation from service, if available.
      const doc = service.docs;
      const idName = service.id || 'id';
      const idType = doc.idType || 'integer';
      let version = config.versionPrefix ? path.match(config.versionPrefix) : null;
      version = version ? ' ' + version[0] : '';
      const apiPath = path.replace(config.prefix, '');
      const group = apiPath.split('/');
      const tag = (apiPath.indexOf('/') > -1 ? group[0] : apiPath) + version;
      const model = apiPath.indexOf('/') > -1 ? group[1] : apiPath;
      const security = [];

      // if (rootDoc.security) {
      //   security[rootDoc.security.name] = [];
      // }

      // if (rootDoc.ignore.tags.indexOf(tag) > -1) {
      //   return;
      // }

      const pathObj = rootDoc.paths;
      const withIdKey = `/${path}/{${idName}}`;
      const withoutIdKey = `/${path}`;
      const securities = doc.securities || [];

      if (typeof doc.definition !== 'undefined') {
        rootDoc.definitions[tag] = doc.definition;
        rootDoc.definitions[`${tag} list`] = {
          type: 'array',
          items: doc.definition
        };
      }
      if (typeof doc.definitions !== 'undefined') {
        rootDoc.definitions = Object.assign(rootDoc.definitions, doc.definitions);
      }

      // FIND
      if (typeof service.find === 'function') {
        pathObj[withoutIdKey] = pathObj[withoutIdKey] || {};
        pathObj[withoutIdKey].get = utils.operation('find', service, {
          tags: [tag],
          description: 'Retrieves a list of all resources from the service.',
          parameters: [{
            description: 'Number of results to return',
            in: 'query',
            name: '$limit',
            type: 'integer'
          },
          {
            description: 'Number of results to skip',
            in: 'query',
            name: '$skip',
            type: 'integer'
          },
          {
            description: 'Property to sort results',
            in: 'query',
            name: '$sort',
            type: 'string'
          }
          ],
          responses: {
            '200': {
              description: 'success',
              schema: {
                '$ref': '#/definitions/' + `${tag} list`
              }
            },
            '500': {
              description: 'general error'
            },
            '401': {
              description: 'not authenticated'
            }
          },
          produces: rootDoc.produces,
          consumes: rootDoc.consumes,
          security: securities.indexOf('find') > -1 ? security : []
        });
      }

      // GET
      if (typeof service.get === 'function') {
        pathObj[withIdKey] = pathObj[withIdKey] || {};
        pathObj[withIdKey].get = utils.operation('get', service, {
          tags: [tag],
          description: 'Retrieves a single resource with the given id from the service.',
          parameters: [{
            description: `ID of ${model} to return`,
            in: 'path',
            required: true,
            name: idName,
            type: idType
          }],
          responses: {
            '200': {
              description: 'success',
              schema: {
                '$ref': '#/definitions/' + tag
              }
            },
            '500': {
              description: 'general error'
            },
            '401': {
              description: 'not authenticated'
            },
            '404': {
              description: 'not found'
            }
          },
          produces: rootDoc.produces,
          consumes: rootDoc.consumes,
          security: securities.indexOf('get') > -1 ? security : []
        });
      }

      // CREATE
      if (typeof service.create === 'function') {
        pathObj[withoutIdKey] = pathObj[withoutIdKey] || {};
        pathObj[withoutIdKey].post = utils.operation('create', service, {
          tags: [tag],
          description: 'Creates a new resource with data.',
          parameters: [{ in: 'body',
            name: 'body',
            required: true,
            schema: {
              '$ref': '#/definitions/' + tag
            }
          }],
          responses: {
            '201': {
              description: 'created'
            },
            '500': {
              description: 'general error'
            },
            '401': {
              description: 'not authenticated'
            }
          },
          produces: rootDoc.produces,
          consumes: rootDoc.consumes,
          security: securities.indexOf('create') > -1 ? security : []
        });
      }

      // UPDATE
      if (typeof service.update === 'function') {
        pathObj[withIdKey] = pathObj[withIdKey] || {};
        pathObj[withIdKey].put = utils.operation('update', service, {
          tags: [tag],
          description: 'Updates the resource identified by id using data.',
          parameters: [{
            description: 'ID of ' + model + ' to return',
            in: 'path',
            required: true,
            name: idName,
            type: idType
          }, { in: 'body',
            name: 'body',
            required: true,
            schema: {
              '$ref': '#/definitions/' + tag
            }
          }],
          responses: {
            '200': {
              description: 'success',
              schema: {
                '$ref': '#/definitions/' + tag
              }
            },
            '500': {
              description: 'general error'
            },
            '401': {
              description: 'not authenticated'
            },
            '404': {
              description: 'not found'
            }
          },
          produces: rootDoc.produces,
          consumes: rootDoc.consumes,
          security: securities.indexOf('update') > -1 ? security : []
        });
      }

      // PATCH
      if (typeof service.patch === 'function') {
        pathObj[withIdKey] = pathObj[withIdKey] || {};
        pathObj[withIdKey].patch = utils.operation('patch', service, {
          tags: [tag],
          description: 'Updates the resource identified by id using data.',
          parameters: [{
            description: 'ID of ' + model + ' to return',
            in: 'path',
            required: true,
            name: idName,
            type: idType
          }, { in: 'body',
            name: 'body',
            required: true,
            schema: {
              '$ref': '#/definitions/' + tag
            }
          }],
          responses: {
            '200': {
              description: 'success',
              schema: {
                '$ref': '#/definitions/' + tag
              }
            },
            '500': {
              description: 'general error'
            },
            '401': {
              description: 'not authenticated'
            },
            '404': {
              description: 'not found'
            }
          },
          produces: rootDoc.produces,
          consumes: rootDoc.consumes,
          security: securities.indexOf('patch') > -1 ? security : []
        });
      }

      // REMOVE
      if (typeof service.remove === 'function') {
        pathObj[withIdKey] = pathObj[withIdKey] || {};
        pathObj[withIdKey].delete = utils.operation('remove', service, {
          tags: [tag],
          description: 'Removes the resource with id.',
          parameters: [{
            description: 'ID of ' + model + ' to return',
            in: 'path',
            required: true,
            name: idName,
            type: idType
          }],
          responses: {
            '200': {
              description: 'success',
              schema: {
                '$ref': '#/definitions/' + tag
              }
            },
            '500': {
              description: 'general error'
            },
            '401': {
              description: 'not authenticated'
            },
            '404': {
              description: 'not found'
            }
          },
          produces: rootDoc.produces,
          consumes: rootDoc.consumes,
          security: securities.indexOf('remove') > -1 ? security : []
        });
      }

      rootDoc.paths = pathObj;

      const existingTag = rootDoc.tags.find(item => item.name === tag);
      if (!existingTag) {
        rootDoc.tags.push(utils.tag(tag, doc));
      } else {
        Object.assign(existingTag, utils.tag(tag, doc));
      }
    };

    // Optional: Register this plugin as a Feathers provider
    if (app.version && parseInt(app.version, 10) >= 3) {
      app.mixins.push(configurePlugin);
    } else {
      app.providers.push((path, service) => configurePlugin(service, path));
    }
  };
};

Object.assign(init, utils);
