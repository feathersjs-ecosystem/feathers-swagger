/* eslint-disable no-unused-expressions */
const { Type, querySyntax } = require('@feathersjs/typebox');

const { isPlainObject } = require('lodash');
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
      expect(operation('find', {
        docs: {},
        find () {
        }
      }, {})).to.deep.equal({
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
      expect(operation('find', {
        docs: {},
        find () {
        }
      }, defaults)).to.deep.equal(defaults);
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
        find () {
        }
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
        find () {
        }
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
    const without$IdAndTypeBoxProperties = (schema) => {
      const { $id, ...rest } = schema;
      const resultObject = {};
      Object.entries(rest).forEach(([key, value]) => {
        if (typeof key === 'string') { // Filter out symbol properties of TypeBox
          resultObject[key] = isPlainObject(value) ? without$IdAndTypeBoxProperties(value) : value;
        }
      });

      return resultObject;
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
      const messagePatchSchema = Type.Partial(messageDataSchema, {
        $id: 'MessagePatch'
      });

      const topicSchema = Type.Object(
        { name: Type.String(), messages: Type.Array(Type.Ref(messageSchema)), stickyMessage: Type.Ref(messageSchema) },
        { $id: 'Topic', additionalProperties: false }
      );

      it('with refs and list when all generated schemas are provided', () => {
        const result = createSwaggerServiceOptions({
          schemas: {
            messageDataSchema,
            messageSchema,
            messageQuerySchema,
            messagePatchSchema
          }
        });

        expect(result).to.deep.equal({
          multipart: false,
          schemas: {
            Message: without$IdAndTypeBoxProperties(messageSchema),
            MessageData: without$IdAndTypeBoxProperties(messageDataSchema),
            MessagePatch: without$IdAndTypeBoxProperties(messagePatchSchema),
            MessageQuery: without$IdAndTypeBoxProperties(Type.Omit(messageQuerySchema, ['$limit', '$skip'])),
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
            patchRequest: 'MessagePatch',
            queryParameters: 'MessageQuery'
          },
          model: 'Message'
        });
      });

      it('with refs and list when some generated schemas are provided', () => {
        const result = createSwaggerServiceOptions({
          schemas: {
            messageDataSchema,
            messageSchema,
            messageQuerySchema
          }
        });

        expect(result).to.deep.equal({
          multipart: false,
          schemas: {
            Message: without$IdAndTypeBoxProperties(messageSchema),
            MessageData: without$IdAndTypeBoxProperties(messageDataSchema),
            MessageQuery: without$IdAndTypeBoxProperties(Type.Omit(messageQuerySchema, ['$limit', '$skip'])),
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
          multipart: false,
          description: 'My description',
          refs: { createResponse: 'MySchema' },
          schemas: {
            MessageData: without$IdAndTypeBoxProperties(messageDataSchema),
            MySchema: {}
          }
        });
      });

      it('with mapped ref for schemas when key is a known refKey', () => {
        const result = createSwaggerServiceOptions({ schemas: { patchRequest: messageDataSchema } });

        expect(result).to.deep.equal({
          multipart: false,
          schemas: {
            MessageData: without$IdAndTypeBoxProperties(messageDataSchema)
          },
          refs: {
            patchRequest: 'MessageData'
          }
        });
      });

      it('with schema references', () => {
        const result = createSwaggerServiceOptions({ schemas: { getResponse: topicSchema } });

        expect(result).to.deep.equal({
          multipart: false,
          schemas: {
            Topic: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                stickyMessage: {
                  $ref: '#/components/schemas/Message'
                },
                messages: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Message'
                  }
                }
              },
              required: [
                'name',
                'messages',
                'stickyMessage'
              ],
              additionalProperties: false
            }
          },
          refs: {
            getResponse: 'Topic'
          }
        });
      });
    });

    it('should use custom transformSchema function', () => {
      const jsonSchema = {
        $id: 'SimpleIdObject',
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: {
          id: {
            type: 'number'
          }
        }
      };

      const result = createSwaggerServiceOptions({
        schemas: { getResponse: jsonSchema },
        transformSchema: (schema) => ({ destroyed: true })
      });

      expect(result).to.deep.equal({
        multipart: false,
        schemas: {
          SimpleIdObject: {
            destroyed: true
          }
        },
        refs: {
          getResponse: 'SimpleIdObject'
        }
      });
    });
  });
});
