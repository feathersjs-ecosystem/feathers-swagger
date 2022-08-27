const AbstractApiGenerator = require('../openapi');
const { isPaginationEnabled } = require('../helpers');
const utils = require('../utils');

function idPathParameters (idName, idType, description) {
  const idNames = Array.isArray(idName) ? idName : [idName];
  const idTypes = Array.isArray(idType) ? idType : [idType];
  const params = [];

  for (let i = 0; i < idNames.length; i++) {
    const name = idNames[i];

    params.push({
      in: 'path',
      name,
      description,
      type: idTypes[i] || idTypes[0],
      required: true
    });
  }

  return params;
}

function jsonSchemaRef (ref) {
  if (typeof ref === 'object' && ref.refs) {
    throw new Error('Multiple refs defined as object are only supported with openApiVersion 3');
  }

  return {
    $ref: `#/definitions/${ref}`
  };
}

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

  getOperationsRefs (service, model) {
    const modelList = `${model}_list`;
    const refs = {
      findResponse: isPaginationEnabled(service) ? `${model}_pagination` : modelList,
      getResponse: model,
      createRequest: model,
      createResponse: model,
      createMultiRequest: model,
      createMultiResponse: model,
      updateRequest: model,
      updateResponse: model,
      updateMultiRequest: modelList,
      updateMultiResponse: modelList,
      patchRequest: model,
      patchResponse: model,
      patchMultiRequest: model,
      patchMultiResponse: modelList,
      removeResponse: model,
      removeMultiResponse: modelList,
      filterParameter: model,
      sortParameter: ''
    };
    if (typeof this.config.defaults.getOperationsRefs === 'function') {
      Object.assign(refs, this.config.defaults.getOperationsRefs(model, service));
    }
    if (typeof service.docs.refs === 'object') {
      Object.assign(refs, service.docs.refs);
    }
    return refs;
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
              schema: jsonSchemaRef(refs.findResponse)
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
          parameters: idPathParameters(idName, idType, `ID of ${modelName} to return`),
          responses: {
            200: {
              description: 'success',
              schema: jsonSchemaRef(refs.getResponse)
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
            schema: jsonSchemaRef(refs.createRequest)
          }],
          responses: {
            201: {
              description: 'created',
              schema: jsonSchemaRef(refs.createResponse)
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
          parameters: idPathParameters(idName, idType, `ID of ${modelName} to return`).concat([{
            in: 'body',
            name: 'body',
            required: true,
            schema: jsonSchemaRef(refs.updateRequest)
          }]),
          responses: {
            200: {
              description: 'success',
              schema: jsonSchemaRef(refs.updateResponse)
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
      updateMulti ({ tags, security, securities, specs, refs }) {
        return {
          tags,
          description: 'Updates multiple resources.',
          parameters: [{
            in: 'body',
            name: 'body',
            required: true,
            schema: jsonSchemaRef(refs.updateMultiRequest)
          }],
          responses: {
            200: {
              description: 'success',
              schema: jsonSchemaRef(refs.updateMultiResponse)
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
          security: utils.security('updateMulti', securities, security)
        };
      },
      patch ({ tags, modelName, idName, idType, security, securities, specs, refs }) {
        return {
          tags,
          description: 'Updates the resource identified by id using data.',
          parameters: idPathParameters(idName, idType, `ID of ${modelName} to update`).concat([{
            in: 'body',
            name: 'body',
            required: true,
            schema: jsonSchemaRef(refs.patchRequest)
          }]),
          responses: {
            200: {
              description: 'success',
              schema: jsonSchemaRef(refs.patchResponse)
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
      patchMulti ({ tags, security, securities, specs, refs }) {
        return {
          tags,
          description: 'Updates multiple resources queried by given filters.',
          parameters: [
            {
              in: 'body',
              name: 'body',
              required: true,
              schema: jsonSchemaRef(refs.patchMultiRequest)
            }
          ],
          responses: {
            200: {
              description: 'success',
              schema: jsonSchemaRef(refs.patchMultiResponse)
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
          security: utils.security('patchMulti', securities, security)
        };
      },
      remove ({ tags, modelName, idName, idType, security, securities, specs, refs }) {
        return {
          tags,
          description: 'Removes the resource with id.',
          parameters: idPathParameters(idName, idType, `ID of ${modelName} to remove`),
          responses: {
            200: {
              description: 'success',
              schema: jsonSchemaRef(refs.removeResponse)
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
      removeMulti ({ tags, security, securities, specs, refs }) {
        return {
          tags,
          description: 'Removes multiple resources queried by given filters.',
          parameters: [],
          responses: {
            200: {
              description: 'success',
              schema: jsonSchemaRef(refs.removeMultiResponse)
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
          security: utils.security('removeMulti', securities, security)
        };
      },
      custom ({ tags, modelName, idName, idType, security, securities, specs, refs }, { method, httpMethod, withId }) {
        const customDoc = {
          tags,
          description: `A custom ${method} method.`,
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

        customDoc.parameters = withId ? idPathParameters(idName, idType, `ID of ${modelName}`) : [];

        if (['post', 'put', 'patch'].includes(httpMethod)) {
          const refRequestName = `${method}Request`;
          if (refs[refRequestName]) {
            customDoc.parameters.push({
              in: 'body',
              name: 'body',
              required: true,
              schema: jsonSchemaRef(refs[refRequestName])
            });
          }
        }

        const refResponseName = `${method}Response`;
        if (refs[refResponseName]) {
          customDoc.responses['200'].schema = jsonSchemaRef(refs[refResponseName]);
        }

        return customDoc;
      }
    };
  }

  applyDefinitionsToSpecs (service, model, modelName, refs) {
    if (typeof service.docs.definition !== 'undefined') {
      this.specs.definitions[model] = service.docs.definition;
      this.specs.definitions[`${model}_list`] = {
        title: `${modelName} list`,
        type: 'array',
        items: { $ref: `#/definitions/${model}` }
      };
    }
    if (typeof service.docs.definitions !== 'undefined') {
      this.specs.definitions = Object.assign(this.specs.definitions, service.docs.definitions);
    }
    if (typeof this.config.defaults.schemasGenerator === 'function') {
      this.specs.definitions = Object.assign(
        this.specs.definitions,
        this.config.defaults.schemasGenerator(service, model, modelName, this.specs.definitions)
      );
    }
    if (isPaginationEnabled(service) &&
      refs.findResponse === `${model}_pagination` &&
      typeof this.specs.definitions[`${model}_list`] !== 'undefined' &&
      typeof this.specs.definitions[`${model}_pagination`] === 'undefined'
    ) {
      this.specs.definitions[`${model}_pagination`] = {
        title: `${modelName} pagination result`,
        type: 'object',
        properties: {
          total: { type: 'integer' },
          limit: { type: 'integer' },
          skip: { type: 'integer' },
          data: { $ref: `#/definitions/${model}_list` }
        }
      };
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
