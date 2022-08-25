/**
 * Example for openapi v3
 * - using definitions option of service.docs to define all needed definitions
 * - using a custom uiIndex file
 * - add parameter to find (globally)
 * - set specific values and sub values for a operation
 * - set/remove a value from all methods
 */

const path = require('path');
const memory = require('feathers-memory');
const swagger = require('../../lib');

module.exports = (app) => {
  const messageService = memory();
  const uiIndexFile = path.join(__dirname, 'docs.html');

  messageService.docs = {
    description: 'A service to send and receive messages',
    definitions: {
      messages: {
        type: 'object',
        required: [
          'text'
        ],
        properties: {
          text: {
            type: 'string',
            description: 'The message text'
          },
          userId: {
            type: 'string',
            description: 'The id of the user that send the message'
          }
        }
      },
      messages_list: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/messages'
        }
      }
    },
    operations: {
      get: {
        description: 'This is my custom get description',
        'responses.200.description': 'Change just the description'
      },
      all: {
        'parameters[-]': { $ref: '#/components/parameters/customHeaderBefore' },
        'parameters[]': { $ref: '#/components/parameters/customHeaderAfter' },
        'responses.401': undefined
      }
    }
  };

  app.configure(swagger({
    openApiVersion: 3,
    prefix: 'v3/definitions/',
    docsJsonPath: '/v3/definitions.json',
    ui: swagger.swaggerUI({ docsPath: '/v3/definitions', indexFile: uiIndexFile }),
    defaults: {
      operations: {
        find: {
          'parameters[]': {
            description: 'My custom query parameter',
            in: 'query',
            name: '$custom',
            schema: {
              type: 'string'
            }
          }
        }
      }
    },
    specs: {
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0'
      },
      components: {
        parameters: {
          customHeaderBefore: {
            description: 'My custom header before all other parameters',
            in: 'header',
            required: false,
            name: 'X-Custom-Header-Before',
            schema: {
              type: 'string'
            }
          },
          customHeaderAfter: {
            description: 'My custom header after all other parameters',
            in: 'header',
            required: true,
            name: 'X-Custom-Header-After',
            schema: {
              type: 'string'
            }
          }
        }
      }
    },
    include: {
      paths: ['v3/definitions/messages']
    }
  }))
    .use('/v3/definitions/messages', messageService);
};
