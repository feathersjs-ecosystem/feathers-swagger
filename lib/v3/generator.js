const AbstractApiGenerator = require('../openapi');
const utils = require('../utils');

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

  getOperationSpecDefaults () {
    return {
      parameters: [],
      responses: {},
      description: '',
      summary: '',
      tags: [],
      security: []
    };
  }

  getOperationDefaults () {
    return {
      find ({ tags, security, securities, refs }) {
        return {
          tags,
          description: 'Retrieves a list of all resources from the service.',
          parameters: [
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
          ],
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
          security: utils.security('find', securities, security)
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
          security: utils.security('get', securities, security)
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
          security: utils.security('create', securities, security)
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
          security: utils.security('update', securities, security)
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
          security: utils.security('patch', securities, security)
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
          security: utils.security('remove', securities, security)
        };
      }
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
