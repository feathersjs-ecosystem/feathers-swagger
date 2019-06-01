/**
 * Example for swagger v2
 * - using default swagger ui with uiIndex: true
 * - just define the model with definition option of service.docs
 * - use service with multi: true and define multi option
 * - for swagger v2 filter parameters have to be defined manually
 */

const memory = require('feathers-memory');
const swagger = require('../../lib');

module.exports = (app) => {
  const messageService = memory({ multi: true });

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
    multi: ['patch', 'remove'],
    operations: {
      find: {
        'parameters[+]': {
          description: `UserId to find messages for`,
          in: 'query',
          required: false,
          name: 'userId',
          type: 'string'
        }
      },
      patchMulti: {
        'parameters[-]': {
          description: `UserId to update messages for`,
          in: 'query',
          required: true,
          name: 'userId',
          type: 'string'
        }
      },
      removeMulti: {
        'parameters[-]': {
          description: `UserId to delete messages for`,
          in: 'query',
          required: true,
          name: 'userId',
          type: 'string'
        }
      }
    }
  };

  app.configure(swagger({
    openApiVersion: 2,
    docsPath: '/v2/multi',
    prefix: 'v2/multi/',
    docsJsonPath: '/v2/multi.json',
    uiIndex: true,
    specs: {
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0'
      }
    },
    include: {
      paths: ['v2/multi/messages']
    }
  }))
    .use('/v2/multi/messages', messageService);
};
