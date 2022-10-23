/**
 * Example for openapi v3
 * - using default swagger ui with ui option
 * - just define the model with definition option of service.docs
 * - use service with multi: true and define multi option
 * - use refs.sortParameter
 * - use schemasGenerator
 * - use custom default schemaName for list
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
    multi: ['patch', 'remove', 'create'],
    refs: {
      sortParameter: 'messages_sort_filter'
    }
  };

  app.configure(swagger({
    openApiVersion: 3,
    prefix: 'v3/multi/',
    docsJsonPath: '/v3/multi.json',
    ui: swagger.swaggerUI({ docsPath: '/v3/multi' }),
    specs: {
      info: {
        title: 'A test',
        description: 'An example with "multi mode" service',
        version: '1.0.0'
      }
    },
    include: {
      paths: ['v3/multi/messages']
    },
    defaults: {
      schemaNames: {
        list: (model) => `${model}_list`
      },
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
