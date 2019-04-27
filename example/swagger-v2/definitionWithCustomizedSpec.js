/**
 * Example for swagger v2
 * - using default swagger ui with uiIndex: true
 * - just define the model with definition option of service.docs
 * - use a customized default (function) for update
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
    }
  };

  app.configure(swagger({
    docsPath: '/v2/definition-with-customized-update',
    prefix: 'v2/definition-with-customized-update/',
    docsJsonPath: '/v2/definition-with-customized-update.json',
    uiIndex: true,
    specs: {
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0'
      }
    },
    include: {
      paths: ['v2/definition-with-customized-update/messages']
    },
    defaults: {
      update ({ tag, model, idName, idType, security, securities, specs }) {
        return {
          tags: [tag, 'update'],
          description: 'Changed stuff',
          parameters: [{
            description: `Some custom text still with ${model}`,
            in: 'path',
            required: true,
            name: idName,
            type: idType
          }, {
            in: 'body',
            name: 'body',
            required: true,
            schema: {
              $ref: `#/definitions/${tag}`
            }
          }],
          responses: {
            500: {
              description: 'will always fail :D'
            }
          },
          produces: specs.produces,
          consumes: specs.consumes,
          security: securities.indexOf('update') > -1 ? security : []
        };
      }
    }
  }))
    .use('/v2/definition-with-customized-update/messages', messageService);
};
