const { operation } = require('./utils');
const AbstractApiGenerator = require('../openapi');

class OpenApiV3Generator extends AbstractApiGenerator {
  getDefaultSpecs () {
    return {
      paths: {},
      components: {
        schemas: {}
      },
      openapi: '3.0.2',
      tags: [],
      info: {}
    };
  }

  getDefaults () {
    return {
      // method defaults generators
      find ({ tags, security, securities, config, refs }) {
        let parameters = [
          {
            description: 'Number of results to return',
            in: 'query',
            name: '$limit',
            schema: {
              type: 'integer'
            }
          }, {
            description: 'Number of results to skip',
            in: 'query',
            name: '$skip',
            schema: {
              type: 'integer'
            }
          }, {
            description: 'Property to sort results',
            in: 'query',
            name: '$sort',
            schema: {
              type: 'string'
            }
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
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${refs.findResponse}`
                  }
                }
              }
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          security: securities.indexOf('find') > -1 ? security : []
        };
      },
      get ({ tags, modelName, idName, idType, security, securities, refs }) {
        return {
          tags,
          description: 'Retrieves a single resource with the given id from the service.',
          parameters: [{
            description: `ID of ${modelName} to return`,
            in: 'path',
            required: true,
            name: idName,
            schema: {
              type: idType
            }
          }],
          responses: {
            200: {
              description: 'success',
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${refs.getResponse}`
                  }
                }
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
          security: securities.indexOf('get') > -1 ? security : []
        };
      },
      create ({ tags, security, securities, refs }) {
        return {
          tags,
          description: 'Creates a new resource with data.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${refs.createRequest}`
                }
              }
            }
          },
          responses: {
            201: {
              description: 'created',
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${refs.createResponse}`
                  }
                }
              }
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          security: securities.indexOf('create') > -1 ? security : []
        };
      },
      update ({ tags, modelName, idName, idType, security, securities, refs }) {
        return {
          tags,
          description: 'Updates the resource identified by id using data.',
          parameters: [{
            description: `ID of ${modelName} to return`,
            in: 'path',
            required: true,
            name: idName,
            schema: {
              type: idType
            }
          }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${refs.updateRequest}`
                }
              }
            }
          },
          responses: {
            200: {
              description: 'success',
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${refs.updateResponse}`
                  }
                }
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
          security: securities.indexOf('update') > -1 ? security : []
        };
      },
      patch ({ tags, modelName, idName, idType, security, securities, refs }) {
        return {
          tags,
          description: 'Updates the resource identified by id using data.',
          parameters: [{
            description: `ID of ${modelName} to return`,
            in: 'path',
            required: true,
            name: idName,
            schema: {
              type: idType
            }
          }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${refs.patchRequest}`
                }
              }
            }
          },
          responses: {
            200: {
              description: 'success',
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${refs.patchResponse}`
                  }
                }
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
          security: securities.indexOf('patch') > -1 ? security : []
        };
      },
      remove ({ tags, modelName, idName, idType, security, securities, refs }) {
        return {
          tags,
          description: 'Removes the resource with id.',
          parameters: [{
            description: `ID of ${modelName} to return`,
            in: 'path',
            required: true,
            name: idName,
            schema: {
              type: idType
            }
          }],
          responses: {
            200: {
              description: 'success',
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${refs.removeResponse}`
                  }
                }
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
      this.specs.components.schemas[model] = service.docs.definition;
      this.specs.components.schemas[`${model}_list`] = {
        title: `${model} list`,
        type: 'array',
        items: service.docs.definition
      };
    }
    if (typeof service.docs.schema !== 'undefined') {
      this.specs.components.schemas[model] = service.docs.schema;
      this.specs.components.schemas[`${model}_list`] = {
        title: `${model} list`,
        type: 'array',
        items: service.docs.schema
      };
    }
    if (typeof service.docs.definitions !== 'undefined') {
      this.specs.components.schemas = Object.assign(this.specs.components.schemas, service.docs.definitions);
    }
    if (typeof service.docs.schemas !== 'undefined') {
      this.specs.components.schemas = Object.assign(this.specs.components.schemas, service.docs.schemas);
    }
  }
}

module.exports = OpenApiV3Generator;
