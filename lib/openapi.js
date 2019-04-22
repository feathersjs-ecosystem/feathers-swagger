const utils = require('./utils');

class OpenApiGenerator {
  constructor (app, specs, config) {
    this.config = Object.assign({
      ignore: {
        tags: []
      }
    }, config || {});
    this.specs = Object.assign(specs, {
      paths: {},
      definitions: {},
      swagger: '2.0',
      schemes: ['http'],
      tags: [],
      basePath: '/',
      consumes: ['application/json'],
      produces: ['application/json'],
      info: {}
    }, config.specs || {});

    this.addService = this.addService.bind(this);
  }

  addService (service, path) {
    service.docs = service.docs || {};

    // Load documentation from service, if available.
    const doc = service.docs;
    const idName = service.id || 'id';
    const idType = doc.idType || this.config.idType || 'integer';
    let version = this.config.versionPrefix ? path.match(this.config.versionPrefix) : null;
    version = version ? ` ${version[0]}` : '';
    const apiPath = path.replace(this.config.prefix, '');
    const group = apiPath.split('/');
    const tag = (apiPath.indexOf('/') > -1 ? group[0] : apiPath) + version;
    const model = apiPath.indexOf('/') > -1 ? group[1] : apiPath;
    const security = [];

    if (this.specs.security && Array.isArray(this.specs.security)) {
      this.specs.security.forEach(function (schema) {
        security.push(schema);
      });
    }

    if (this.config.ignore.tags.indexOf(tag) > -1) {
      return;
    }

    const pathObj = this.specs.paths;
    const withIdKey = `/${path}/{${idName}}`;
    const withoutIdKey = `/${path}`;
    const securities = doc.securities || [];

    if (typeof doc.definition !== 'undefined') {
      this.specs.definitions[tag] = doc.definition;
      this.specs.definitions[`${tag} list`] = {
        type: 'array',
        items: doc.definition
      };
    }
    if (typeof doc.definitions !== 'undefined') {
      this.specs.definitions = Object.assign(this.specs.definitions, doc.definitions);
    }

    // FIND
    if (typeof service.find === 'function') {
      let parameters = [
        {
          description: 'Number of results to return',
          in: 'query',
          name: '$limit',
          type: 'integer'
        }, {
          description: 'Number of results to skip',
          in: 'query',
          name: '$skip',
          type: 'integer'
        }, {
          description: 'Property to sort results',
          in: 'query',
          name: '$sort',
          type: 'string'
        }
      ];
      if (
        this.config.findQueryParameters !== undefined &&
        this.config.findQueryParameters.length > 0
      ) {
        parameters = parameters.filter(
          parametersItem =>
            !this.config.findQueryParameters.find(
              findQueryParameters =>
                parametersItem.name === findQueryParameters.name
            )
        );
        parameters = this.config.findQueryParameters.concat(parameters);
      }
      pathObj[withoutIdKey] = pathObj[withoutIdKey] || {};
      pathObj[withoutIdKey].get = utils.operation('find', service, {
        tags: [tag],
        description: 'Retrieves a list of all resources from the service.',
        parameters,
        responses: {
          200: {
            description: 'success',
            schema: {
              $ref: `#/definitions/${tag} list`
            }
          },
          401: {
            description: 'not authenticated'
          },
          500: {
            description: 'general error'
          }
        },
        produces: this.specs.produces,
        consumes: this.specs.consumes,
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
          200: {
            description: 'success',
            schema: {
              $ref: `#/definitions/${tag}`
            }
          },
          401: {
            description: 'not authenticated'
          },
          404: {
            description: 'not found'
          },
          500: {
            description: 'general error'
          }
        },
        produces: this.specs.produces,
        consumes: this.specs.consumes,
        security: securities.indexOf('get') > -1 ? security : []
      });
    }

    // CREATE
    if (typeof service.create === 'function') {
      pathObj[withoutIdKey] = pathObj[withoutIdKey] || {};
      pathObj[withoutIdKey].post = utils.operation('create', service, {
        tags: [tag],
        description: 'Creates a new resource with data.',
        parameters: [{
          in: 'body',
          name: 'body',
          required: true,
          schema: {
            $ref: `#/definitions/${tag}`
          }
        }],
        responses: {
          201: {
            description: 'created'
          },
          401: {
            description: 'not authenticated'
          },
          500: {
            description: 'general error'
          }
        },
        produces: this.specs.produces,
        consumes: this.specs.consumes,
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
          description: `ID of ${model} to return`,
          in: 'path',
          required: true,
          name: idName,
          type: idType
        }, {
          in: 'body',
          name: 'body',
          required: true,
          schema: {
            $ref: `#/definitions/${tag}`
          }
        }],
        responses: {
          200: {
            description: 'success',
            schema: {
              $ref: `#/definitions/${tag}`
            }
          },
          401: {
            description: 'not authenticated'
          },
          404: {
            description: 'not found'
          },
          500: {
            description: 'general error'
          }
        },
        produces: this.specs.produces,
        consumes: this.specs.consumes,
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
          description: `ID of ${model} to return`,
          in: 'path',
          required: true,
          name: idName,
          type: idType
        }, {
          in: 'body',
          name: 'body',
          required: true,
          schema: {
            $ref: `#/definitions/${tag}`
          }
        }],
        responses: {
          200: {
            description: 'success',
            schema: {
              $ref: `#/definitions/${tag}`
            }
          },
          401: {
            description: 'not authenticated'
          },
          404: {
            description: 'not found'
          },
          500: {
            description: 'general error'
          }
        },
        produces: this.specs.produces,
        consumes: this.specs.consumes,
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
          description: `ID of ${model} to return`,
          in: 'path',
          required: true,
          name: idName,
          type: idType
        }],
        responses: {
          200: {
            description: 'success',
            schema: {
              $ref: `#/definitions/${tag}`
            }
          },
          401: {
            description: 'not authenticated'
          },
          404: {
            description: 'not found'
          },
          500: {
            description: 'general error'
          }
        },
        produces: this.specs.produces,
        consumes: this.specs.consumes,
        security: securities.indexOf('remove') > -1 ? security : []
      });
    }

    this.specs.paths = pathObj;

    const existingTag = this.specs.tags.find(item => item.name === tag);
    if (!existingTag) {
      this.specs.tags.push(utils.tag(tag, doc));
    } else {
      Object.assign(existingTag, utils.tag(tag, doc));
    }
  }
}

module.exports = OpenApiGenerator;
