const _ = require('lodash');
const AbstractApiGenerator = require('../openapi');
const { isPaginationEnabled } = require('../helpers');
const utils = require('../utils');

function addDefinitionToSchemas (schemas, definition, model, modelName, schemaNames) {
  schemas[model] = definition;
  schemas[schemaNames.list(model)] = {
    title: `${modelName} list`,
    type: 'array',
    items: { $ref: `#/components/schemas/${model}` }
  };
}

function filterParameter (refs, ref = 'filterParameter', properties = {}) {
  if (_.isEmpty(refs[ref])) {
    return undefined;
  }

  return {
    description: 'Query parameters to filter',
    in: 'query',
    name: 'filter',
    style: 'form',
    explode: true,
    schema: { $ref: `#/components/schemas/${refs[ref]}` },
    ...properties
  };
}

function jsonSchemaRef (ref) {
  if (typeof ref === 'object' && ref.refs) {
    const { refs, type, ...rest } = ref;

    return {
      'application/json': {
        schema: {
          [type]: refs.map(innerRef => ({ $ref: `#/components/schemas/${innerRef}` })),
          ...rest
        }
      }
    };
  }

  return {
    'application/json': {
      schema: {
        $ref: `#/components/schemas/${ref}`
      }
    }
  };
}

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
      schema: {
        type: idTypes[i] || idTypes[0]
      },
      required: true
    });
  }

  return params;
}

class OpenApiV3Generator extends AbstractApiGenerator {
  getDefaultSpecs () {
    return {
      paths: {},
      components: {
        schemas: {}
      },
      openapi: '3.0.3',
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

  getOperationsRefs (service, model, schemaNames) {
    const modelList = schemaNames.list(model);
    const refs = {
      findResponse: isPaginationEnabled(service) ? schemaNames.pagination(model) : modelList,
      getResponse: model,
      createRequest: model,
      createResponse: model,
      createMultiRequest: { refs: [model, modelList], type: 'oneOf' },
      createMultiResponse: { refs: [model, modelList], type: 'oneOf' },
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
      sortParameter: '',
      queryParameters: ''
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
      find ({ tags, security, securities, refs }) {
        const parameters = [
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
          }
        ];
        if (!_.isEmpty(refs.queryParameters)) {
          const queryParameters = filterParameter(refs, 'queryParameters', { description: 'Query parameters' });
          if (queryParameters) {
            parameters.push(queryParameters);
          }
        } else {
          parameters.push(
            {
              description: 'Property to sort results',
              in: 'query',
              name: '$sort',
              style: 'deepObject',
              schema: {
                ...(refs.sortParameter ? { $ref: `#/components/schemas/${refs.sortParameter}` } : { type: 'object' })
              }
            }
          );

          const filterParams = filterParameter(refs);
          if (filterParams) {
            parameters.push(filterParams);
          }
        }

        return {
          tags,
          description: 'Retrieves a list of all resources from the service.',
          parameters,
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.findResponse)
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
          parameters: idPathParameters(idName, idType, `ID of ${modelName} to return`),
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.getResponse)
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
      create ({ tags, security, securities, refs, multiOperations }) {
        const multi = multiOperations.includes('create');
        return {
          tags,
          description: 'Creates a new resource with data.',
          requestBody: {
            required: true,
            content: multi ? jsonSchemaRef(refs.createMultiRequest) : jsonSchemaRef(refs.createRequest)
          },
          responses: {
            201: {
              description: 'created',
              content: multi ? jsonSchemaRef(refs.createMultiResponse) : jsonSchemaRef(refs.createResponse)
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
          parameters: idPathParameters(idName, idType, `ID of ${modelName} to update`),
          requestBody: {
            required: true,
            content: jsonSchemaRef(refs.updateRequest)
          },
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.updateResponse)
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
      updateMulti ({ tags, security, securities, refs }) {
        return {
          tags,
          description: 'Updates multiple resources.',
          parameters: [],
          requestBody: {
            required: true,
            content: jsonSchemaRef(refs.updateMultiRequest)
          },
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.updateMultiResponse)
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security('updateMulti', securities, security)
        };
      },
      patch ({ tags, modelName, idName, idType, security, securities, refs }) {
        return {
          tags,
          description: 'Updates the resource identified by id using data.',
          parameters: idPathParameters(idName, idType, `ID of ${modelName} to update`),
          requestBody: {
            required: true,
            content: jsonSchemaRef(refs.patchRequest)
          },
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.patchResponse)
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
      patchMulti ({ tags, security, securities, refs }) {
        return {
          tags,
          description: 'Updates multiple resources queried by given filters.',
          parameters: [filterParameter(refs)],
          requestBody: {
            required: true,
            content: jsonSchemaRef(refs.patchMultiRequest)
          },
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.patchMultiResponse)
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security('patchMulti', securities, security)
        };
      },
      remove ({ tags, modelName, idName, idType, security, securities, refs }) {
        return {
          tags,
          description: 'Removes the resource with id.',
          parameters: idPathParameters(idName, idType, `ID of ${modelName} to remove`),
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.removeResponse)
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
      },
      removeMulti ({ tags, security, securities, refs }) {
        return {
          tags,
          description: 'Removes multiple resources queried by given filters.',
          parameters: [filterParameter(refs)],
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.removeMultiResponse)
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security('removeMulti', securities, security)
        };
      },
      custom ({ tags, modelName, idName, idType, security, securities, refs }, { method, httpMethod, withId }) {
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
          security: utils.security(method, securities, security)
        };

        if (withId) {
          customDoc.parameters = idPathParameters(idName, idType, `ID of ${modelName}`);
        }

        if (['post', 'put', 'patch'].includes(httpMethod)) {
          const refRequestName = `${method}Request`;
          if (refs[refRequestName]) {
            customDoc.requestBody = {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${refs[refRequestName]}`
                  }
                }
              }
            };
          }
        }

        const refResponseName = `${method}Response`;
        if (refs[refResponseName]) {
          customDoc.responses['200'].content = {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${refs[refResponseName]}`
              }
            }
          };
        }

        return customDoc;
      }
    };
  }

  applyDefinitionsToSpecs (service, model, modelName, refs, schemaNames) {
    if (typeof service.docs.definition !== 'undefined') {
      addDefinitionToSchemas(this.specs.components.schemas, service.docs.definition, model, modelName, schemaNames);
    }
    if (typeof service.docs.schema !== 'undefined') {
      addDefinitionToSchemas(this.specs.components.schemas, service.docs.schema, model, modelName, schemaNames);
    }
    if (typeof service.docs.definitions !== 'undefined') {
      this.specs.components.schemas = Object.assign(this.specs.components.schemas, service.docs.definitions);
    }
    if (typeof service.docs.schemas !== 'undefined') {
      this.specs.components.schemas = Object.assign(this.specs.components.schemas, service.docs.schemas);
    }
    if (typeof this.config.defaults.schemasGenerator === 'function') {
      this.specs.components.schemas = Object.assign(
        this.specs.components.schemas,
        this.config.defaults.schemasGenerator(service, model, modelName, this.specs.components.schemas)
      );
    }
    if (isPaginationEnabled(service)) {
      const list = schemaNames.list(model);
      const pagination = schemaNames.pagination(model);
      if (
        refs.findResponse === pagination &&
        typeof this.specs.components.schemas[list] !== 'undefined' &&
        typeof this.specs.components.schemas[pagination] === 'undefined'
      ) {
        this.specs.components.schemas[pagination] = {
          title: `${modelName} pagination result`,
          type: 'object',
          properties: {
            total: { type: 'integer' },
            limit: { type: 'integer' },
            skip: { type: 'integer' },
            data: { $ref: `#/components/schemas/${list}` }
          }
        };
      }
    }
  }

  getPathParameterSpec (name) {
    return {
      in: 'path',
      name,
      schema: {
        type: 'string'
      },
      required: true,
      description: name + ' parameter'
    };
  }
}

module.exports = OpenApiV3Generator;
