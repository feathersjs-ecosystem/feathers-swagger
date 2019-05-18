const AbstractApiGenerator = require('../openapi');
const utils = require('../utils');

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

  getOperationDefaults () {
    return {
      find ({ tags, security, securities, specs, refs }) {
        return {
          tags,
          description: 'Retrieves a list of all resources from the service.',
          parameters: [
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
          ],
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
          security: utils.security('find', securities, security)
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
          security: utils.security('get', securities, security)
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
          security: utils.security('create', securities, security)
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
          security: utils.security('update', securities, security)
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
          security: utils.security('patch', securities, security)
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
          security: utils.security('remove', securities, security)
        };
      },
      custom ({ tags, modelName, idName, idType, security, securities, specs, refs }, { method, httpMethod, withId }) {
        const customDoc = {
          tags,
          description: `A custom ${method} method.`,
          parameters: [],
          responses: {
            200: {
              description: 'success'
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
          security: utils.security(method, securities, security)
        };

        if (withId) {
          customDoc.parameters[0] = {
            description: `ID of ${modelName}`,
            in: 'path',
            required: true,
            name: idName,
            type: idType
          };
        }

        if (['post', 'put', 'patch'].includes(httpMethod)) {
          const refRequestName = `${method}Request`;
          if (refs[refRequestName]) {
            customDoc.parameters.push({
              in: 'body',
              name: 'body',
              required: true,
              schema: {
                $ref: `#/definitions/${refs[refRequestName]}`
              }
            });
          }
        }

        const refResponseName = `${method}Response`;
        if (refs[refResponseName]) {
          customDoc.responses['200'].schema = {
            $ref: `#/definitions/${refs[refResponseName]}`
          };
        }

        return customDoc;
      }
    };
  }

  applyDefinitionsToSpecs (service, model) {
    if (typeof service.docs.definition !== 'undefined') {
      this.specs.definitions[model] = service.docs.definition;
      this.specs.definitions[`${model}_list`] = {
        title: `${model} list`,
        type: 'array',
        items: { $ref: `#/definitions/${model}` }
      };
    }
    if (typeof service.docs.definitions !== 'undefined') {
      this.specs.definitions = Object.assign(this.specs.definitions, service.docs.definitions);
    }
  }

  getPathParameterSpec (name) {
    return {
      in: 'path',
      name,
      type: 'string',
      required: true,
      description: name + ' parameter'
    };
  }
}

module.exports = OpenApiV2Generator;
