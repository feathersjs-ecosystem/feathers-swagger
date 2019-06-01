/**
 * Example for openapi v3
 * - using default swagger ui with uiIndex: true
 * - just define the model with definition option of service.docs
 * - use service with multi: true and define multi option
 * - use refs.sortParameter
 * - use schemasGenerator
 */

const memory = require('feathers-memory');
const swagger = require('../../lib');

module.exports = (app) => {
  const messageService = memory({ multi: true });

  messageService.model = {
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
  };

  messageService.docs = {
    description: 'A service to send and receive messages',
    multi: ['patch', 'remove'],
    refs: {
      sortParameter: 'messages_sort_filter'
    }
  };

  app.configure(swagger({
    openApiVersion: 3,
    docsPath: '/v3/multi',
    prefix: 'v3/multi/',
    docsJsonPath: '/v3/multi.json',
    uiIndex: true,
    specs: {
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0'
      }
    },
    include: {
      paths: ['v3/multi/messages']
    },
    defaults: {
      schemasGenerator (service, model, modelName) {
        // here you could transform an orm model to json schema for example
        // we simply reuse the schema

        return {
          [model]: service.model,
          [`${model}_list`]: {
            title: `${modelName} list`,
            type: 'array',
            items: { $ref: `#/components/schemas/${model}` }
          },
          [`${model}_sort_filter`]: {
            title: `${modelName} sorting parameter`,
            type: 'object',
            properties: {
              text: {
                type: 'integer',
                description: 'sort by text, -1 for descending'
              },
              userId: {
                type: 'integer',
                description: 'sort by userId, -1 for descending'
              }
            }
          }
        };
      }
    }
  }))
    .use('/v3/multi/messages', messageService);
};
