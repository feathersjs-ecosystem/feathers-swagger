/**
 * Example for swagger v2
 * - using definitions option of service.docs to define all needed definitions
 * - using custom tag
 * - using custom tags, with one being ignored
 * - using custom model
 * - using externalDocs
 * - using custom list schemaName
 */

const memory = require('feathers-memory');
const swagger = require('../../lib');

module.exports = (app) => {
  const messageService = memory();

  messageService.docs = {
    tag: 'message',
    description: 'A service to send and receive messages',
    externalDocs: {
      description: 'find more info here',
      url: 'https://swagger.io/about'
    },
    tags: ['message', 'additional', 'ignored'],
    model: 'custom_message',
    definitions: {
      custom_message: {
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
      custom_message_list: {
        title: 'List of Messages',
        type: 'array',
        items: {
          $ref: '#/definitions/custom_message'
        }
      }
    },
    schemaNames: {
      list: () => 'custom_message_list'
    }
  };

  app.configure(swagger({
    openApiVersion: 2,
    prefix: 'v2/custom-tags/',
    docsJsonPath: '/v2/custom-tags.json',
    ui: swagger.swaggerUI({ docsPath: '/v2/custom-tags' }),
    specs: {
      info: {
        title: 'A test',
        description: 'An example using custom tags and model',
        version: '1.0.0'
      },
      tags: [swagger.tag('additional', {
        description: 'An additional tag, that can be used'
      })]
    },
    include: {
      paths: ['v2/custom-tags/messages']
    },
    ignore: {
      tags: ['ignored']
    }
  }))
    .use('/v2/custom-tags/messages', messageService);
};
