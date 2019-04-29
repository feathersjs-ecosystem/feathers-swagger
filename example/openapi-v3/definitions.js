/**
 * Example for openapi v3
 * - using definitions option of service.docs to define all needed definitions
 * - using a custom uiIndex file
 * - using findQueryParameters option
 */

const path = require('path');
const memory = require('feathers-memory');
const swagger = require('../../lib');

module.exports = (app) => {
  const messageService = memory();
  const uiIndex = path.join(__dirname, 'docs.html');

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
      'messages_list': {
        type: 'array',
        items: {
          $ref: `#/components/schemas/messages`
        }
      }
    },
    get: {
      description: 'This is my custom get description'
    }
  };

  app.configure(swagger({
    openApiVersion: 3,
    docsPath: '/v3/definitions',
    prefix: 'v3/definitions/',
    docsJsonPath: '/v3/definitions.json',
    uiIndex,
    findQueryParameters: [
      {
        description: 'My custom query parameter',
        in: 'query',
        name: '$custom',
        schema: {
          type: 'string'
        }
      }
    ],
    specs: {
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0'
      }
    },
    include: {
      paths: ['v3/definitions/messages']
    }
  }))
    .use('/v3/definitions/messages', messageService);
};
