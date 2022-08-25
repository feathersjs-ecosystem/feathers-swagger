/**
 * Example for openapi v3
 * - using definitions option of service.docs to define all needed definitions
 * - add security definitions
 * - configure security for service operations
 * - use custom security definitions for specific operation
 * - use Swagger UI plugin @mairu/swagger-ui-apikey-auth-form for convenient bearer token usage
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
          $ref: '#/components/schemas/messages'
        }
      }
    },
    securities: ['create', 'update', 'patch', 'remove'],
    operations: {
      find: {
        security: [
          { BasicAuth: [] }
        ]
      }
    }
  };

  app.get('/v3/security/swagger-ui-apikey-auth-form.js', function (req, res) {
    res.sendFile(require.resolve('@mairu/swagger-ui-apikey-auth-form/dist/swagger-ui-apikey-auth-form'));
  });
  app.configure(swagger({
    openApiVersion: 3,
    prefix: 'v3/security/',
    docsJsonPath: '/v3/security.json',
    ui: swagger.swaggerUI({
      docsPath: '/v3/security',
      getSwaggerInitializerScript: ({ docsJsonPath }) => {
        // language=JavaScript
        return `
          window.onload = function() {
            var script = document.createElement('script');
            script.onload = function () {
              window.ui = SwaggerUIBundle({
                url: "${docsJsonPath}",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset,
                  SwaggerUIApiKeyAuthFormPlugin,
                ],
                plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                configs: {
                  apiKeyAuthFormPlugin: {
                    forms: {
                      BearerAuth: {
                        authCallback(values, callback) {
                          // mimic logic process
                          if (values.username === 'user' && values.password === 'secret') {
                            callback(null, 'secret-key');
                          } else {
                            callback('invalid credentials');
                          }
                        },
                      }
                    },
                    localStorage: {
                      BearerAuth: {}
                    }
                  }
                }
              });
            };

            script.src = '/v3/security/swagger-ui-apikey-auth-form.js';
            document.head.appendChild(script)
          };
        `;
      }
    }),
    specs: {
      info: {
        title: 'A test',
        description: 'An example using security definitions and swagger ui plugin.' +
          ' The valid credentials for BearerAuth in this example are `user` with password `secret`.',
        version: '1.0.0'
      },
      components: {
        securitySchemes: {
          BasicAuth: {
            type: 'http',
            scheme: 'basic'
          },
          BearerAuth: {
            type: 'http',
            scheme: 'bearer'
          }
        }
      },
      security: [
        { BearerAuth: [] }
      ]
    },
    include: {
      paths: ['v3/security/messages']
    }
  }))
    .use('/v3/security/messages', messageService);
};
