/**
 * Example for swagger v2
 * - using definitions option of service.docs to define all needed definitions
 * - add security definitions
 * - configure security for service operations
 * - use custom security definitions for specific operation
 */

const memory = require('feathers-memory');
const swagger = require('../../lib');

module.exports = (app) => {
  const messageService = memory();

  messageService.docs = {
    description: 'A service to send and receive messages',
    definitions: {
      messages: {
        title: 'Message',
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
        title: 'List of Messages',
        type: 'array',
        items: {
          $ref: `#/definitions/messages`
        }
      }
    },
    securities: ['create', 'update', 'patch', 'remove'],
    find: {
      security: [
        { BasicAuth: [] }
      ]
    }
  };

  app.configure(swagger({
    docsPath: '/v2/security',
    prefix: 'v2/security/',
    docsJsonPath: '/v2/security.json',
    uiIndex: true,
    specs: {
      info: {
        title: 'A test',
        description: 'An example using custom tags and model',
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
      paths: ['v2/security/messages']
    }
  }))
    .use('/v2/security/messages', messageService);
};
