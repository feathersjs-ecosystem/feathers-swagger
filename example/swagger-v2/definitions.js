/**
 * Example for swagger v2
 * - using definitions option of service.docs to define all needed definitions
 * - service with pagination
 * - using swagger ui with a custom indexFile
 * - add parameter to find (globally)
 * - set specific values and sub values for a operation
 */

const path = require('path');
const memory = require('feathers-memory');
const swagger = require('../../lib');

module.exports = (app) => {
  const messageService = memory({ paginate: { default: 10 } });
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
      messagesList: {
        type: 'array',
        items: {
          $ref: '#/definitions/messages'
        }
      }
    },
    operations: {
      get: {
        description: 'This is my custom get description',
        'responses.200.description': 'Change just the description'
      },
      all: {
        'parameters[-]': { $ref: '#/definitions/customHeaderBefore' },
        'parameters[]': { $ref: '#/definitions/customHeaderAfter' },
        'responses.401': undefined
      }
    }
  };

  app.configure(swagger({
    openApiVersion: 2,
    prefix: 'v2/definitions/',
    docsJsonPath: '/v2/definitions.json',
    ui: swagger.swaggerUI({ docsPath: '/v2/definitions', indexFile: uiIndexFile }),
    defaults: {
      operations: {
        find: {
          'parameters[]': {
            description: 'My custom query parameter',
            in: 'query',
            name: '$custom',
            type: 'string'
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
      definitions: {
        customHeaderBefore: {
          description: 'My custom header before all other parameters',
          in: 'header',
          required: false,
          name: 'X-Custom-Header-Before',
          type: 'string'
        },
        customHeaderAfter: {
          description: 'My custom header after all other parameters',
          in: 'header',
          required: true,
          name: 'X-Custom-Header-After',
          type: 'string'
        }
      }
    },
    include: {
      paths: ['v2/definitions/messages']
    }
  }))
    .use('/v2/definitions/messages', messageService);
};
