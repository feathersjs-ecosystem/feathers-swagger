/**
 * Example for swagger v2
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
      'messages list': {
        type: 'array',
        items: {
          $ref: `#/definitions/messages`
        }
      }
    },
    get: {
      description: 'This is my custom get description'
    }
  };

  app.configure(swagger({
    docsPath: '/v2/definitions',
    prefix: 'v2/definitions/',
    docsJsonPath: '/v2/definitions.json',
    uiIndex,
    findQueryParameters: [
      {
        description: 'My custom query parameter',
        in: 'query',
        name: '$custom',
        type: 'string'
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
      paths: ['v2/definitions/messages']
    }
  }))
    .use('/v2/definitions/messages', messageService);
};
