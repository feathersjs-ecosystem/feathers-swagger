/* eslint-disable no-unused-expressions */
const { Type, querySyntax } = require('@feathersjs/typebox');

const { expect } = require('chai');
const { operation, tag, security, idPathParameters, createSwaggerServiceOptions } = require('../lib/utils');

describe('util tests', () => {
  describe('operation', () => {
    const defaults = {
      parameters: ['default', 'parameter'],
      responses: { default: 'responses' },
      description: 'default description',
      summary: 'default summary',
      tags: ['default', 'tags'],
      consumes: ['default', 'consumes'],
      produces: ['default', 'produces'],
      security: ['default', 'security']
    };

    it('should provide spec defaults for empty service.docs.operations[method] and defaults', () => {
      expect(operation('find', { docs: {}, find () {} }, {})).to.deep.equal({
        parameters: [],
        responses: {},
        description: '',
        summary: '',
        tags: [],
        consumes: [],
        produces: [],
        security: []
      });
    });

    it('should consume defaults', () => {
      expect(operation('find', { docs: {}, find () {} }, defaults)).to.deep.equal(defaults);
    });

    it('should prefer prefer method.docs over service.docs.operations[method] overservice.docs.operations.all ', () => {
      const service = {
        docs: {
          operations: {
            all: {
              tags: ['onlyAll'],
              summary: 'global summary'
            },
            find: {
              description: 'description of docs.find',
              summary: 'only from docs.operations.find'
            }
          }
        },
        find () {}
      };
      service.find.docs = {
        description: 'description of find.docs'
      };

      expect(operation('find', service, defaults)).to.deep.equal({
        parameters: defaults.parameters,
        responses: defaults.responses,
        description: 'description of find.docs',
        summary: 'only from docs.operations.find',
        tags: ['onlyAll'],
        consumes: defaults.consumes,
        produces: defaults.produces,
        security: defaults.security
      });
    });

    it('should support setting of nested path keys', () => {
      const service = {
        docs: {
          operations: {
            find: {
              description: 'description of docs.find',
              'nested.added': 'key'
            }
          }
        },
        find () {}
      };

      expect(operation('find', service, {}, { nested: { object: 'value' } })).to.deep.equal({
        description: 'description of docs.find',
        nested: {
          object: 'value',
          added: 'key'
        }
      });
    });
  });

  describe('tag', () => {
    it('should provide a default description', () => {
      expect(tag('message')).to.deep.equal({
        name: 'message',
        description: 'A message service'
      });
    });

    it('should consume known options', () => {
      const options = {
        description: 'my description',
        externalDocs: {
          url: 'https://example.com',
          description: 'The external documentation'
        },
        additionalOption: 'should not be consumed'
      };
      expect(tag('message', options)).to.deep.equal({
        name: 'message',
        description: options.description,
        externalDocs: options.externalDocs
      });
    });
  });

  describe('security', () => {
    const securityDefinitions = [
      { BasicAuth: [] }
    ];

    const securities = ['create'];

    it('should return empty array when method should not be secured', () => {
      expect(security('find', securities, securityDefinitions)).to.deep.equals([]);
    });

    it('should return security definitions array when method should be secured', () => {
      expect(security('create', securities, securityDefinitions)).to.equals(securityDefinitions);
    });

    it('should return security definitions array when all methods should be secured', () => {
      expect(security('create', ['all'], securityDefinitions)).to.equals(securityDefinitions);
    });
  });

  describe('idPathParameters', () => {
    it('should return id path parameters when idName is string', () => {
      expect(idPathParameters('id', ',')).to.deep.equals('{id}');
    });

    it('should return id path parameters when idName is array', () => {
      expect(idPathParameters(['id'], ',')).to.deep.equals('{id}');
    });

    it('should return id path parameters when idName is array with multiple items', () => {
      expect(idPathParameters(['firstId', 'secondId'], ',')).to.deep.equals('{firstId},{secondId}');
    });

    it('should return id path parameters when idName is array with multiple items and custom idSeparator', () => {
      expect(idPathParameters(['firstId', 'secondId'], '|')).to.deep.equals('{firstId}|{secondId}');
    });
  });

  describe('createSwaggerServiceOptions', () => {
    const without$Id = (schema) => {
      const { $id, ...rest } = schema;
      return rest;
    };

    describe('should create swaggerServiceOptions for TypeBox (or json) schemas', () => {
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

      it('with refs and list when all generated schemas are provided', () => {
        const result = createSwaggerServiceOptions({ schemas: { messageDataSchema, messageSchema, messageQuerySchema } });

        expect(result).to.deep.equal({
          schemas: {
            Message: without$Id(messageSchema),
            MessageData: without$Id(messageDataSchema),
            MessagePatchData: without$Id(Type.Partial(messageDataSchema)),
            MessageQuery: Type.Omit(messageQuerySchema, ['$limit', '$skip']),
            MessageList: {
              items: {
                $ref: '#/components/schemas/Message'
              },
              type: 'array'
            }
          },
          refs: {
            createRequest: 'MessageData',
            updateRequest: 'MessageData',
            patchRequest: 'MessagePatchData',
            queryParameters: 'MessageQuery'
          },
          model: 'Message'
        });
      });

      it('without refs for schemas with id', () => {
        const result = createSwaggerServiceOptions({
          schemas: { messageDataSchema, messageQuerySchema },
          docs: {
            description: 'My description',
            definitions: { MySchema: {} },
            refs: { createResponse: 'MySchema' }
          }
        });

        expect(result).to.deep.equal({
          description: 'My description',
          refs: { createResponse: 'MySchema' },
          schemas: {
            MessageData: without$Id(messageDataSchema),
            MySchema: {}
          }
        });
      });

      it('with mapped ref for schemas when key is a known refKey', () => {
        const result = createSwaggerServiceOptions({ schemas: { patchRequest: messageDataSchema } });

        expect(result).to.deep.equal({
          schemas: {
            MessageData: without$Id(messageDataSchema)
          },
          refs: {
            patchRequest: 'MessageData'
          }
        });
      });
    });
  });
});
