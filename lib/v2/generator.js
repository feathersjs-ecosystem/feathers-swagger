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
      find ({ tag, security, securities, specs, config }) {
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
          produces: specs.produces,
          consumes: specs.consumes,
          security: securities.indexOf('find') > -1 ? security : []
        };
      },
      get ({ tag, model, idName, idType, security, securities, specs }) {
        return {
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
          produces: specs.produces,
          consumes: specs.consumes,
          security: securities.indexOf('get') > -1 ? security : []
        };
      },
      create ({ tag, security, securities, specs }) {
        return {
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
          produces: specs.produces,
          consumes: specs.consumes,
          security: securities.indexOf('create') > -1 ? security : []
        };
      },
      update ({ tag, model, idName, idType, security, securities, specs }) {
        return {
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
          produces: specs.produces,
          consumes: specs.consumes,
          security: securities.indexOf('update') > -1 ? security : []
        };
      },
      patch ({ tag, model, idName, idType, security, securities, specs }) {
        return {
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
          produces: specs.produces,
          consumes: specs.consumes,
          security: securities.indexOf('patch') > -1 ? security : []
        };
      },
      remove ({ tag, model, idName, idType, security, securities, specs }) {
        return {
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
}

module.exports = OpenApiV2Generator;
