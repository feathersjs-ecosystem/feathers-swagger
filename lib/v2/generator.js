const { operation } = require('../utils');
const AbstractApiGenerator = require('../openapi');

class OpenApiV2Generator extends AbstractApiGenerator {
  getDefaultSpecs () {
    return {
      paths: {},
      definitions: {},
      swagger: '2.0',
      schemes: ['http'],
      tags: [],
      basePath: '/',
      consumes: ['application/json'],
      produces: ['application/json'],
      info: {}
    };
  }

  getDefaults () {
    return {
      // utility methods
      // getOperationArgs({ service, path, config, apiPath, version }) {},
      // method defaults generators
      find ({ tags, security, securities, specs, config, refs }) {
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
          config.findQueryParameters !== undefined &&
          config.findQueryParameters.length > 0
        ) {
          parameters = parameters.filter(
            parametersItem =>
              !config.findQueryParameters.find(
                findQueryParameters =>
                  parametersItem.name === findQueryParameters.name
              )
          );
          parameters = config.findQueryParameters.concat(parameters);
        }

        return {
          tags,
          description: 'Retrieves a list of all resources from the service.',
          parameters,
          responses: {
            200: {
              description: 'success',
              schema: {
                $ref: `#/definitions/${refs.findResponse}`
              }
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          produces: specs.produces,
          consumes: specs.consumes,
          security: securities.indexOf('find') > -1 ? security : []
        };
      },
      get ({ tags, modelName, idName, idType, security, securities, specs, refs }) {
        return {
          tags,
          description: 'Retrieves a single resource with the given id from the service.',
          parameters: [{
            description: `ID of ${modelName} to return`,
            in: 'path',
            required: true,
            name: idName,
            type: idType
          }],
          responses: {
            200: {
              description: 'success',
              schema: {
                $ref: `#/definitions/${refs.getResponse}`
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
          produces: specs.produces,
          consumes: specs.consumes,
          security: securities.indexOf('get') > -1 ? security : []
        };
      },
      create ({ tags, security, securities, specs, refs }) {
        return {
          tags,
          description: 'Creates a new resource with data.',
          parameters: [{
            in: 'body',
            name: 'body',
            required: true,
            schema: {
              $ref: `#/definitions/${refs.createRequest}`
            }
          }],
          responses: {
            201: {
              description: 'created',
              schema: {
                $ref: `#/definitions/${refs.createResponse}`
              }
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          produces: specs.produces,
          consumes: specs.consumes,
          security: securities.indexOf('create') > -1 ? security : []
        };
      },
      update ({ tags, modelName, idName, idType, security, securities, specs, refs }) {
        return {
          tags,
          description: 'Updates the resource identified by id using data.',
          parameters: [{
            description: `ID of ${modelName} to return`,
            in: 'path',
            required: true,
            name: idName,
            type: idType
          }, {
            in: 'body',
            name: 'body',
            required: true,
            schema: {
              $ref: `#/definitions/${refs.updateRequest}`
            }
          }],
          responses: {
            200: {
              description: 'success',
              schema: {
                $ref: `#/definitions/${refs.updateResponse}`
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
          produces: specs.produces,
          consumes: specs.consumes,
          security: securities.indexOf('update') > -1 ? security : []
        };
      },
      patch ({ tags, modelName, idName, idType, security, securities, specs, refs }) {
        return {
          tags,
          description: 'Updates the resource identified by id using data.',
          parameters: [{
            description: `ID of ${modelName} to return`,
            in: 'path',
            required: true,
            name: idName,
            type: idType
          }, {
            in: 'body',
            name: 'body',
            required: true,
            schema: {
              $ref: `#/definitions/${refs.patchRequest}`
            }
          }],
          responses: {
            200: {
              description: 'success',
              schema: {
                $ref: `#/definitions/${refs.patchResponse}`
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
          produces: specs.produces,
          consumes: specs.consumes,
          security: securities.indexOf('patch') > -1 ? security : []
        };
      },
      remove ({ tags, modelName, idName, idType, security, securities, specs, refs }) {
        return {
          tags,
          description: 'Removes the resource with id.',
          parameters: [{
            description: `ID of ${modelName} to return`,
            in: 'path',
            required: true,
            name: idName,
            type: idType
          }],
          responses: {
            200: {
              description: 'success',
              schema: {
                $ref: `#/definitions/${refs.removeResponse}`
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
          produces: specs.produces,
          consumes: specs.consumes,
          security: securities.indexOf('remove') > -1 ? security : []
        };
      }
    };
  }

  getOperationUtil () {
    return operation;
  }

  getOperationArgs ({ service, path, config, apiPath, version }) {
    const group = apiPath.split('/');
    const tag = (apiPath.indexOf('/') > -1 ? group[0] : apiPath) + version;
    const model = apiPath.indexOf('/') > -1 ? group[1] : apiPath;
    const security = [];

    if (this.specs.security && Array.isArray(this.specs.security)) {
      this.specs.security.forEach(function (schema) {
        security.push(schema);
      });
    }
    const securities = service.docs.securities || [];

    return {
      tag,
      tags: [tag],
      model,
      modelName: model,
      security,
      securities
    };
  }

  applyDefinitionsToSpecs (service, model) {
    if (typeof service.docs.definition !== 'undefined') {
      this.specs.definitions[model] = service.docs.definition;
      this.specs.definitions[`${model}_list`] = {
        title: `${model} list`,
        type: 'array',
        items: service.docs.definition
      };
    }
    if (typeof service.docs.definitions !== 'undefined') {
      this.specs.definitions = Object.assign(this.specs.definitions, service.docs.definitions);
    }
  }
}

module.exports = OpenApiV2Generator;
