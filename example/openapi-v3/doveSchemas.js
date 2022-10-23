/**
 * Example for openapi v3
 * - using schemas introduced with dove (feathers v5) with createSwaggerServiceOptions
 * - service with pagination
 * - use include.filter option
 */

const memory = require('feathers-memory');
const { Type, querySyntax } = require('@feathersjs/typebox');
const swagger = require('../../lib');

module.exports = (app) => {
  app.configure(swagger({
    openApiVersion: 3,
    prefix: 'v3/dove-schemas/',
    docsJsonPath: '/v3/dove-schemas.json',
    ui: swagger.swaggerUI({ docsPath: '/v3/dove-schemas' }),
    specs: {
      info: {
        title: 'A test',
        description: 'Show the result when using schema from feathers dove',
        version: '1.0.0'
      }
    },
    include: {
      filter (service, path) {
        return service.includeThisServiceProp === true;
      }
    }
  }));

  const messageDataSchema = Type.Object(
    { message: Type.String() }, { $id: 'MessageData', additionalProperties: false }
  );
  const messageSchema = Type.Intersect(
    [
      Type.Object({
        id: Type.Number()
      }),
      messageDataSchema
    ],
    { $id: 'Message' }
  );
  const messageQuerySchema = Type.Intersect([
    querySyntax(messageSchema),
    Type.Object({})
  ]);

  const messageService = memory({ paginate: { default: 10, max: 50 } });
  messageService.includeThisServiceProp = true;

  app.use('/v3/dove-schemas/messages', messageService, {
    // A list of all methods this service exposes externally
    methods: ['find', 'get', 'create', 'update', 'patch', 'remove'],
    // You can add additional custom events to be sent to clients here
    events: [],
    docs: swagger.createSwaggerServiceOptions({
      schemas: { messageSchema, messageDataSchema, messageQuerySchema },
      docs: {
        description: 'A custom description'
      }
    })
  });
};
