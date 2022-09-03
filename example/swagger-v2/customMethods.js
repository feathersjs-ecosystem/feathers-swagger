/**
 * Example for swagger v2
 * - using parameters in path to service
 * - using custom methods introduced with @feathersjs/express v4
 *   - with security
 *   - with refs for request and response
 */
const swagger = require('../../lib');

module.exports = (app) => {
  const service = {
    find (params) {
      return Promise.resolve({ method: 'find', params });
    },
    customPost: swagger.customMethod('POST', '/do-post')((data, params) => {
      return Promise.resolve({ method: 'customPost', data, params });
    }),
    customPatchWithId: swagger.customMethod('PUT', '/do-patch-with/:__feathersId')(
      (data, params, id) => {
        return Promise.resolve({ method: 'customPatchWithId', id, data, params });
      }
    ),
    customGetWithCustomIds: swagger.customMethod('GET', '/do-patch-with/:customId/:customId2')(
      (data, params) => {
        return Promise.resolve({ method: 'customGetWithCustomIds', data, params });
      }
    )
  };

  service.docs = {
    description: 'A service with custom methods',
    pathParams: {
      pathParamName: {
        description: 'A global path param',
        in: 'path',
        name: 'pathParamName',
        type: 'string',
        required: true
      }
    },
    tag: 'custom method service',
    definitions: {
      custom_response: {
        title: 'Custom service response',
        type: 'object',
        required: [
          'method'
        ],
        properties: {
          method: {
            type: 'string',
            description: 'name of the called method'
          },
          data: {
            type: 'object',
            description: 'POST data provided to the service method'
          },
          params: {
            type: 'object',
            description: 'params provided to the service method'
          },
          id: {
            type: 'integer',
            description: 'id provided to the service method'
          }
        }
      },
      custom_request: {
        title: 'Custom service requestBody',
        type: 'object',
        required: [
          'method'
        ],
        properties: {
          string: {
            type: 'string',
            description: 'some string data'
          },
          number: {
            type: 'number',
            format: 'int32',
            description: 'a number'
          }
        }
      }
    },
    securities: ['customPost'],
    refs: {
      customPostRequest: 'custom_request',
      customPostResponse: 'custom_response',
      customPatchWithIdRequest: 'custom_request',
      customPatchWithIdResponse: 'custom_response'
    },
    operations: {
      find: {
        description: 'Do something with a GET method',
        // remove default parameters with nested path 'logic'
        'parameters[3]': undefined,
        'parameters[2]': undefined,
        'parameters[1]': {
          description: 'A defined param',
          in: 'query',
          name: 'test',
          type: 'string'
        },
        'responses.200': {
          description: 'Use find to do a normal GET',
          schema: { $ref: '#/definitions/custom_response' }
        }
      },
      customPost: {
        description: 'A custom POST method',
        'parameters[]': {
          description: 'A defined param',
          in: 'query',
          name: 'test',
          type: 'string'
        }
      },
      customGetWithCustomIds: {
        description: 'A custom GET method',
        'parameters[1]': {
          description: 'Custom integer path id',
          in: 'path',
          required: true,
          name: 'customId',
          type: 'integer'
        },
        'parameters[2]': {
          description: 'Custom string path id',
          in: 'path',
          required: true,
          name: 'customId2',
          type: 'string'
        }
      }
    }
  };

  app.configure(swagger({
    openApiVersion: 2,
    prefix: 'v2/custom-methods/',
    docsJsonPath: '/v2/custom-methods.json',
    ui: swagger.swaggerUI({ docsPath: '/v2/custom-methods' }),
    specs: {
      info: {
        title: 'A test',
        description: 'An example using custom methods',
        version: '1.0.0'
      },
      securityDefinitions: {
        BasicAuth: {
          type: 'basic'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      security: [
        { ApiKeyAuth: [] }
      ]
    },
    include: {
      paths: ['v2/custom-methods/:pathParamName/service']
    }
  }))
    .use(
      '/v2/custom-methods/:pathParamName/service',
      service,
      { methods: ['find', 'customPost', 'customPatchWithId', 'customGetWithCustomIds'] },
    );
};
