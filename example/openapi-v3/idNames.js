/**
 * Example for openapi v3
 * - using default swagger ui with uiIndex: true
 * - just define the model with definition option of service.docs
 * - use custom idNames for the different operations
 * - change description of id parameter
 */

const memory = require('feathers-memory');
const swagger = require('../../lib');

module.exports = (app) => {
  const messageService = memory();

  messageService.docs = {
    description: 'A service to send and receive messages',
    definition: {
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
    idNames: {
      get: 'slug',
      update: 'uid',
      patch: 'pid',
      remove: 'rid'
    },
    operations: {
      get: {
        'parameters[0].description': 'Slug for the message'
      }
    }
  };

  app.configure(swagger({
    openApiVersion: 3,
    docsPath: '/v3/id-names',
    prefix: 'v3/id-names/',
    docsJsonPath: '/v3/id-names.json',
    uiIndex: true,
    specs: {
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0'
      }
    },
    include: {
      paths: ['v3/id-names/messages']
    }
  }))
    .use('/v3/id-names/messages', messageService);
};
