/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const { activateHooks } = require('@feathersjs/feathers');
const memory = require('feathers-memory');

const OpenApi3Generator = require('../../lib/v3/generator');

const { addCustomMethod } = require('../helper');

const swaggerOptions = {
  specs: {
    info: {
      title: 'openapi generator v3 tests',
      version: '1.0.0'
    }
  }
};

const messageDefinition = {
  type: 'object',
  properties: {
    content: {
      type: 'string'
    }
  }
};

describe('openopi v3 generator', function () {
  it('should generate expected specification for memory service', function () {
    const specs = {};
    const gen = new OpenApi3Generator(specs, swaggerOptions);
    const service = memory();
    service.docs = {
      definition: messageDefinition
    };

    gen.addService(service, 'message');

    expect(specs).to.deep.equal(require('./expected-memory-spec.json'));
  });

  it('should generate expected specification for multi operations of memory service', function () {
    const specs = {};
    const gen = new OpenApi3Generator(specs, swaggerOptions);
    const service = memory({ multi: true });
    service.docs = {
      definition: messageDefinition,
      operations: {
        find: false,
        get: false,
        update: false,
        patch: false,
        remove: false
      }
    };

    gen.addService(service, 'message');

    expect(specs).to.deep.equal(require('./expected-memory-spec-multi-only.json'));
  });

  describe('swaggerOptions', function () {
    let service;
    let specs;

    beforeEach(() => {
      service = {
        find () {},
        get () {},
        docs: {}
      };

      specs = {};
    });

    it('idType should be consumed', function () {
      const gen = new OpenApi3Generator(specs, {
        idType: 'string'
      });

      gen.addService(service, 'message');

      expect(specs.paths['/message/{id}'].get.parameters[0].schema.type).to.equal('string');
    });

    describe('ignore', function () {
      it('services should be ignored by tags', function () {
        const gen = new OpenApi3Generator(specs, {
          ignore: {
            tags: ['message']
          }
        });

        gen.addService(service, 'message');
        gen.addService(service, 'text');

        expect(specs.paths['/message']).to.be.undefined;
        expect(specs.paths['/text']).to.not.be.undefined;
      });

      it('services should be ignored by string path', function () {
        const gen = new OpenApi3Generator(specs, {
          ignore: {
            paths: ['message']
          }
        });

        gen.addService(service, 'message');
        gen.addService(service, 'text');

        expect(specs.paths['/message']).to.be.undefined;
        expect(specs.paths['/text']).to.not.be.undefined;
      });

      it('services should be ignored by regex path', function () {
        const gen = new OpenApi3Generator(specs, {
          ignore: {
            paths: [/mess.*/]
          }
        });

        gen.addService(service, 'message');
        gen.addService(service, 'text');

        expect(specs.paths['/message']).to.be.undefined;
        expect(specs.paths['/text']).to.not.be.undefined;
      });

      it('services should be ignored by filter function not ignoring paths', function () {
        const gen = new OpenApi3Generator(specs, {
          ignore: {
            paths: ['user'],
            filter: (matcherServiceArg, path) => {
              expect(matcherServiceArg).to.be.equal(service);
              return path === 'text';
            }
          }
        });

        gen.addService(service, 'message');
        gen.addService(service, 'text');
        gen.addService(service, 'user');

        expect(specs.paths['/message']).to.not.be.undefined;
        expect(specs.paths['/text']).to.be.undefined;
        expect(specs.paths['/user']).to.be.undefined;
      });
    });

    describe('include', function () {
      it('services should be included by tags', function () {
        const gen = new OpenApi3Generator(specs, {
          include: {
            tags: ['message']
          }
        });

        gen.addService(service, 'message');
        gen.addService(service, 'text');

        expect(specs.paths['/message']).to.not.be.undefined;
        expect(specs.paths['/text']).to.be.undefined;
      });

      it('services should be included by string path', function () {
        const gen = new OpenApi3Generator(specs, {
          include: {
            paths: ['message']
          }
        });

        gen.addService(service, 'message');
        gen.addService(service, 'text');

        expect(specs.paths['/message']).to.not.be.undefined;
        expect(specs.paths['/text']).to.be.undefined;
      });

      it('services should be included by regex path', function () {
        const gen = new OpenApi3Generator(specs, {
          include: {
            paths: [/mess.*/]
          }
        });

        gen.addService(service, 'message');
        gen.addService(service, 'text');

        expect(specs.paths['/message']).to.not.be.undefined;
        expect(specs.paths['/text']).to.be.undefined;
      });

      it('services should be included by filter function not ignoring paths', function () {
        const gen = new OpenApi3Generator(specs, {
          include: {
            paths: ['user'],
            filter: (matcherServiceArg, path) => {
              expect(matcherServiceArg).to.be.equal(service);
              return path === 'message';
            }
          }
        });

        gen.addService(service, 'message');
        gen.addService(service, 'text');
        gen.addService(service, 'user');

        expect(specs.paths['/message']).to.not.be.undefined;
        expect(specs.paths['/text']).to.be.undefined;
        expect(specs.paths['/user']).to.not.be.undefined;
      });
    });

    it('ignore and include should not override each other', function () {
      const gen = new OpenApi3Generator(specs, {
        include: {
          paths: [/mess.*/]
        },
        ignore: {
          paths: [/mess.*/]
        }
      });

      gen.addService(service, 'message');
      gen.addService(service, 'text');

      expect(specs.paths).to.not.be.undefined;
    });

    describe('tag and model parsing', function () {
      it('should support string prefix', function () {
        const gen = new OpenApi3Generator(specs, {
          prefix: 'api/'
        });

        gen.addService(service, 'api/message');

        expect(specs.paths['/api/message'].get.tags).to.deep.equal(['message']);
        expect(specs.paths['/api/message/{id}'].get.tags).to.deep.equal(['message']);
        expect(specs.paths['/api/message'].get.responses[200].content['application/json'].schema.$ref)
          .to.equal('#/components/schemas/message_list');
        expect(specs.paths['/api/message/{id}'].get.responses[200].content['application/json'].schema.$ref)
          .to.equal('#/components/schemas/message');

        expect(specs.tags).to.deep.equal([
          {
            description: 'A message service',
            name: 'message'
          }
        ]);
      });

      it('should support regex prefix', function () {
        const gen = new OpenApi3Generator(specs, {
          prefix: /api\/v\d\//
        });

        gen.addService(service, 'api/v1/message');

        expect(specs.paths['/api/v1/message'].get.tags).to.deep.equal(['message']);
        expect(specs.paths['/api/v1/message/{id}'].get.tags).to.deep.equal(['message']);
        expect(specs.paths['/api/v1/message'].get.responses[200].content['application/json'].schema.$ref)
          .to.equal('#/components/schemas/message_list');
        expect(specs.paths['/api/v1/message/{id}'].get.responses[200].content['application/json'].schema.$ref)
          .to.equal('#/components/schemas/message');
        expect(specs.tags).to.deep.equal([
          {
            description: 'A message service',
            name: 'message'
          }
        ]);
      });

      it('should support regex versionPrefix', function () {
        const gen = new OpenApi3Generator(specs, {
          prefix: /api\/v\d\//,
          versionPrefix: /v\d/
        });

        service.docs.definition = messageDefinition;

        gen.addService(service, 'api/v1/message');

        expect(specs.paths['/api/v1/message'].get.tags).to.deep.equal(['message v1']);
        expect(specs.paths['/api/v1/message/{id}'].get.tags).to.deep.equal(['message v1']);
        expect(specs.paths['/api/v1/message'].get.responses[200].content['application/json'].schema.$ref)
          .to.equal('#/components/schemas/message_v1_list');
        expect(specs.paths['/api/v1/message/{id}'].get.responses[200].content['application/json'].schema.$ref)
          .to.equal('#/components/schemas/message_v1');
        expect(specs.tags).to.deep.equal([
          {
            description: 'A message v1 service',
            name: 'message v1'
          }
        ]);
        expect(specs.components.schemas).to.deep.equal({
          message_v1: messageDefinition,
          message_v1_list: {
            items: {
              $ref: '#/components/schemas/message_v1'
            },
            title: 'message_v1 list',
            type: 'array'
          }
        });
      });

      it('should be customizable by defaults.getOperationArgs generator', function () {
        const gen = new OpenApi3Generator(specs, {
          defaults: {
            getOperationArgs () {
              return {
                tag: 'notFromPath',
                tags: ['notFromPath'],
                model: 'custom',
                modelName: 'NiceName'
              };
            }
          }
        });

        service.docs.definition = messageDefinition;

        gen.addService(service, 'api/message');

        expect(specs.paths['/api/message'].get.tags).to.deep.equal(['notFromPath']);
        expect(specs.paths['/api/message/{id}'].get.tags).to.deep.equal(['notFromPath']);
        expect(specs.paths['/api/message'].get.responses[200].content['application/json'].schema.$ref)
          .to.equal('#/components/schemas/custom_list');
        expect(specs.paths['/api/message/{id}'].get.responses[200].content['application/json'].schema.$ref)
          .to.equal('#/components/schemas/custom');

        expect(specs.tags).to.deep.equal([
          {
            description: 'A notFromPath service',
            name: 'notFromPath'
          }
        ]);

        expect(specs.components.schemas).to.deep.equal({
          custom: messageDefinition,
          custom_list: {
            items: {
              $ref: '#/components/schemas/custom'
            },
            title: 'NiceName list',
            type: 'array'
          }
        });
      });
    });

    describe('defaults', function () {
      it('getOperationArgs should get object as argument', function () {
        const swaggerConfig = {
          prefix: /api\/v\d\//,
          versionPrefix: /v\d/,
          defaults: {
            getOperationArgs (options) {
              expect(options.service).to.equal(service);
              expect(options.path).to.equal('api/v1/message');
              expect(options.config.prefix).to.equal(swaggerConfig.prefix);
              expect(options.config.versionPrefix).to.equal(swaggerConfig.versionPrefix);
              expect(options.config.defaults.getOperationArgs).to.equal(swaggerConfig.defaults.getOperationArgs);
              expect(options.apiPath).to.equal('message');
              expect(options.version).to.equal('v1');
            }
          }
        };
        const gen = new OpenApi3Generator(specs, swaggerConfig);

        gen.addService(service, 'api/v1/message');
      });

      it('getOperationsRefs result should be used as default refs', function () {
        const swaggerConfig = {
          defaults: {
            getOperationsRefs (model, service) {
              expect(model).to.equal('message');
              expect(service).to.equal(service);

              return {
                findResponse: 'own_ref'
              };
            }
          }
        };
        const gen = new OpenApi3Generator(specs, swaggerConfig);

        gen.addService(service, 'message');

        expect(specs.paths['/message'].get.responses[200].content['application/json'].schema.$ref)
          .to.equal('#/components/schemas/own_ref');
        expect(specs.paths['/message/{id}'].get.responses[200].content['application/json'].schema.$ref)
          .to.equal('#/components/schemas/message');
      });

      it('schemasGenerator result should be merged into components.schemas', function () {
        const swaggerConfig = {
          defaults: {
            schemasGenerator (service, model, modelName, schemas) {
              expect(service).to.equal(service);
              expect(model).to.equal('message');
              expect(modelName).to.equal('message');
              expect(schemas.alreadyThere).to.equal('should_stay');

              return {
                newSchema: 'schema1',
                alreadyThere2: 'schema2'
              };
            }
          }
        };
        specs.components = {
          schemas: {
            alreadyThere: 'should_stay',
            alreadyThere2: 'will_be_overwritten'
          }
        };
        const gen = new OpenApi3Generator(specs, swaggerConfig);

        gen.addService(service, 'message');

        expect(specs.components.schemas).to.deep.equal({
          alreadyThere: 'should_stay',
          alreadyThere2: 'schema2',
          newSchema: 'schema1'
        });
      });

      describe('operationGenerators', function () {
        it('generator should get object as options argument', function () {
          service.docs.securities = ['find'];
          addCustomMethod(service);

          const checkExpectedOptionsArgument = function (options) {
            expect(options.idName).to.equal('id');
            expect(options.idType).to.equal('integer');
            expect(options.tag).to.equal('message');
            expect(options.model).to.equal('message');
            expect(options.modelName).to.equal('message');
            expect(options.tags).to.deep.equal(['message']);
            expect(options.security).to.deep.equal([
              { BearerAuth: [] }
            ]);
            expect(options.securities).to.deep.equal(['find']);
            expect(options.refs).to.deep.equal({
              findResponse: 'message_list',
              getResponse: 'message',
              createRequest: 'message',
              createResponse: 'message',
              createMultiRequest: {
                refs: [
                  'message',
                  'message_list'
                ],
                type: 'oneOf'
              },
              createMultiResponse: {
                refs: [
                  'message',
                  'message_list'
                ],
                type: 'oneOf'
              },
              updateRequest: 'message',
              updateResponse: 'message',
              updateMultiRequest: 'message_list',
              updateMultiResponse: 'message_list',
              patchRequest: 'message',
              patchResponse: 'message',
              patchMultiRequest: 'message',
              patchMultiResponse: 'message_list',
              removeResponse: 'message',
              removeMultiResponse: 'message_list',
              filterParameter: 'message',
              sortParameter: ''
            });
            expect(options.service).to.equal(service);
            expect(options.config.defaults.operationGenerators.find)
              .to.equal(swaggerConfig.defaults.operationGenerators.find);
            expect(options.specs).to.equal(specs);
          };

          const swaggerConfig = {
            specs: {
              security: [
                { BearerAuth: [] }
              ]
            },
            defaults: {
              operationGenerators: {
                find (options) {
                  checkExpectedOptionsArgument(options);
                },
                custom (options) {
                  checkExpectedOptionsArgument(options);
                }
              }
            }
          };
          const gen = new OpenApi3Generator(specs, swaggerConfig);

          gen.addService(service, 'message');
        });
        it('custom generator should get 2nd object with custom operation stuff', function () {
          addCustomMethod(service);

          const swaggerConfig = {
            specs: {
              security: [
                { BearerAuth: [] }
              ]
            },
            defaults: {
              operationGenerators: {
                custom (options, customMethodArg) {
                  expect(customMethodArg.method).to.equal('customMethod');
                  expect(customMethodArg.httpMethod).to.equal('post');
                  expect(customMethodArg.withId).to.equal(false);
                }
              }
            }
          };
          const gen = new OpenApi3Generator(specs, swaggerConfig);

          gen.addService(service, 'message');
        });

        it('options should also include result from getOperationArgs', function () {
          const gen = new OpenApi3Generator(specs, {
            defaults: {
              getOperationArgs (options) {
                return { myOwnOption: 'new stuff', tag: 'overridden' };
              },
              operationGenerators: {
                find (options) {
                  expect(options.myOwnOption).to.equal('new stuff');
                  expect(options.tag).to.equal('overridden');
                }
              }
            }
          });

          gen.addService(service, 'message');
        });

        it('operations defaults should be generated from generator', function () {
          addCustomMethod(service);

          const gen = new OpenApi3Generator(specs, {
            defaults: {
              operationGenerators: {
                find (options) {
                  return {
                    description: 'Only description'
                  };
                },
                get (options) {
                  return false;
                },
                custom (options) {
                  return {
                    description: 'Only custom description'
                  };
                }
              }
            }
          });

          gen.addService(service, 'message');

          expect(specs.paths['/message'].get).to.deep.equal({
            parameters: [],
            responses: {},
            description: 'Only description',
            summary: '',
            tags: [],
            security: []
          });
          expect(specs.paths['/message/{id}']).to.not.exist;
          expect(specs.paths['/message/custom'].post).to.deep.equal({
            parameters: [],
            responses: {},
            description: 'Only custom description',
            summary: '',
            tags: [],
            security: []
          });
        });
      });

      describe('operations', function () {
        it('should set defaults for methods', function () {
          addCustomMethod(service);

          const gen = new OpenApi3Generator(specs, {
            defaults: {
              operations: {
                find: {
                  description: 'Other description for find'
                },
                get: false,
                customMethod: {
                  description: 'Description for specific custom method'
                }
              }
            }
          });

          gen.addService(service, 'message');

          expect(specs.paths['/message'].get.description).to.equal('Other description for find');
          expect(specs.paths['/message/{id}']).to.not.exist;
          expect(specs.paths['/message/custom'].post.description).to.equal('Description for specific custom method');
        });

        it('all should set defaults for all methods', function () {
          addCustomMethod(service);

          const gen = new OpenApi3Generator(specs, {
            defaults: {
              operations: {
                all: {
                  description: 'Global default description'
                }
              }
            }
          });

          gen.addService(service, 'message');

          expect(specs.paths['/message'].get.description).to.equal('Global default description');
          expect(specs.paths['/message/{id}'].get.description).to.equal('Global default description');
          expect(specs.paths['/message/custom'].post.description).to.equal('Global default description');
        });

        it('should support path set syntax for nested structures', function () {
          const headerParam = {
            name: 'X-CUSTOM-HEADER',
            in: 'header',
            description: 'My custom header',
            required: false,
            schema: {
              type: 'string'
            }
          };

          const gen = new OpenApi3Generator(specs, {
            defaults: {
              operations: {
                all: {
                  'parameters[]': headerParam
                }
              }
            }
          });

          gen.addService(service, 'message');

          expect(specs.paths['/message'].get.parameters[4]).to.deep.equal(headerParam);
          expect(specs.paths['/message/{id}'].get.parameters[1]).to.deep.equal(headerParam);
        });
      });
    });
  });

  describe('service.docs options', function () {
    let service;
    let gen;
    let specs;

    beforeEach(() => {
      service = {
        find () {},
        get () {},
        docs: {}
      };

      specs = {};

      gen = new OpenApi3Generator(specs, swaggerOptions);
    });

    it('should work for services without docs property', function () {
      delete service.docs;

      gen.addService(service, 'message');

      expect(specs.paths['/message']).to.not.be.undefined;
    });

    it('definition should be used for creation of model and list spec schemas', function () {
      service.docs.definition = messageDefinition;

      gen.addService(service, 'message');

      expect(specs.components.schemas).to.deep.equal({
        message: messageDefinition,
        message_list: {
          items: {
            $ref: '#/components/schemas/message'
          },
          title: 'message list',
          type: 'array'
        }
      });
    });

    it('schema should be used for creation of model and list spec schemas', function () {
      service.docs.schema = messageDefinition;

      gen.addService(service, 'message');

      expect(specs.components.schemas).to.deep.equal({
        message: messageDefinition,
        message_list: {
          items: {
            $ref: '#/components/schemas/message'
          },
          title: 'message list',
          type: 'array'
        }
      });
    });

    it('definitions should be merged into spec schemas', function () {
      specs.components.schemas = { already: 'in' };
      service.docs.definitions = {
        self: { any: 'key' }
      };

      gen.addService(service, 'message');

      expect(specs.components.schemas).to.deep.equal({
        already: 'in',
        self: { any: 'key' }
      });
    });

    it('schemas should be merged into spec schemas', function () {
      specs.components.schemas = { already: 'in' };
      service.docs.schemas = {
        self: { any: 'key' }
      };

      gen.addService(service, 'message');

      expect(specs.components.schemas).to.deep.equal({
        already: 'in',
        self: { any: 'key' }
      });
    });

    it('tag should be consumed', function () {
      service.docs.tag = 'mytag';

      gen.addService(service, 'message');

      expect(specs.paths['/message'].get.tags).to.deep.equal(['mytag']);
      expect(specs.paths['/message/{id}'].get.tags).to.deep.equal(['mytag']);
      expect(specs.tags).to.deep.equal([
        {
          description: 'A mytag service',
          name: 'mytag'
        }
      ]);
    });

    it('description should be consumed', function () {
      service.docs.description = 'my custom description';

      gen.addService(service, 'message');

      expect(specs.tags).to.deep.equal([
        {
          description: 'my custom description',
          name: 'message'
        }
      ]);
    });

    it('externalDocs should be consumed', function () {
      service.docs.externalDocs = {
        url: 'http://example.org'
      };

      gen.addService(service, 'message');

      expect(specs.tags).to.deep.equal([
        {
          description: 'A message service',
          name: 'message',
          externalDocs: {
            url: 'http://example.org'
          }
        }
      ]);
    });

    describe('tags', function () {
      it('should be consumed', function () {
        service.docs.tags = ['message', 'additional'];

        gen.addService(service, 'message');

        expect(specs.paths['/message'].get.tags).to.deep.equal(['message', 'additional']);
        expect(specs.paths['/message/{id}'].get.tags).to.deep.equal(['message', 'additional']);
        expect(specs.tags).to.deep.equal([
          {
            description: 'A message service',
            name: 'message'
          }
        ]);
      });

      it('unused tag should not be added to specification', function () {
        service.docs.tags = ['additional'];

        gen.addService(service, 'message');

        expect(specs.paths['/message'].get.tags).to.deep.equal(['additional']);
        expect(specs.paths['/message/{id}'].get.tags).to.deep.equal(['additional']);
        expect(specs.tags).to.deep.equal([]);
      });
    });

    it('model should be used for default spec refs and as modelName if not provided', function () {
      service.docs.model = 'own_message';
      service.docs.definition = messageDefinition;

      gen.addService(service, 'message');

      expect(specs.paths['/message'].get.responses[200].content['application/json'].schema.$ref)
        .to.equal('#/components/schemas/own_message_list');
      expect(specs.paths['/message/{id}'].get.responses[200].content['application/json'].schema.$ref)
        .to.equal('#/components/schemas/own_message');
      expect(specs.paths['/message/{id}'].get.parameters[0].description).to.equal('ID of own_message to return');
      expect(specs.components.schemas).to.deep.equal({
        own_message: {
          properties: {
            content: {
              type: 'string'
            }
          },
          type: 'object'
        },
        own_message_list: {
          items: {
            $ref: '#/components/schemas/own_message'
          },
          title: 'own_message list',
          type: 'array'
        }
      });
    });

    it('modelName should be used for definition and descriptions', function () {
      service.docs.model = 'own_message';
      service.docs.modelName = 'MessageNiceName';
      service.docs.definition = messageDefinition;

      gen.addService(service, 'message');

      expect(specs.paths['/message'].get.responses[200].content['application/json'].schema.$ref)
        .to.equal('#/components/schemas/own_message_list');
      expect(specs.paths['/message/{id}'].get.responses[200].content['application/json'].schema.$ref)
        .to.equal('#/components/schemas/own_message');
      expect(specs.paths['/message/{id}'].get.parameters[0].description).to.equal('ID of MessageNiceName to return');
      expect(specs.components.schemas).to.deep.equal({
        own_message: {
          properties: {
            content: {
              type: 'string'
            }
          },
          type: 'object'
        },
        own_message_list: {
          items: {
            $ref: '#/components/schemas/own_message'
          },
          title: 'MessageNiceName list',
          type: 'array'
        }
      });
    });

    describe('securities', function () {
      it('should add security definition to given operations', function () {
        specs.security = [
          { BearerAuth: [] }
        ];
        service.docs.securities = ['find'];

        gen.addService(service, 'message');

        expect(specs.paths['/message'].get.security).to.deep.equal(specs.security);
        expect(specs.paths['/message/{id}'].get.security).to.deep.equal([]);
      });

      it('should add security definition to all operations with "all"', function () {
        specs.security = [
          { BearerAuth: [] }
        ];
        service.docs.securities = ['all'];

        gen.addService(service, 'message');

        expect(specs.paths['/message'].get.security).to.deep.equal(specs.security);
        expect(specs.paths['/message/{id}'].get.security).to.deep.equal(specs.security);
      });
    });

    it('refs should be used for schema refs', function () {
      service.docs.refs = {
        findResponse: 'otherRef',
        getResponse: 'getMessage'
      };

      gen.addService(service, 'message');

      expect(specs.paths['/message'].get.responses[200].content['application/json'].schema.$ref)
        .to.equal('#/components/schemas/otherRef');
      expect(specs.paths['/message/{id}'].get.responses[200].content['application/json'].schema.$ref)
        .to.equal('#/components/schemas/getMessage');
    });

    it('refs.sortParameter should be consumed when not empty', function () {
      service.docs.refs = {
        sortParameter: 'message_sort'
      };

      gen.addService(service, 'message');

      expect(specs.paths['/message'].get.parameters[2].schema.$ref)
        .to.equal('#/components/schemas/message_sort');
    });

    it('refs object should be allowed for schema refs', function () {
      service.docs.refs = {
        findResponse: { refs: ['otherRef', 'getMessage'], type: 'anyOf' },
        getResponse: { refs: ['otherRef', 'getMessage'], type: 'oneOf', discriminator: { propertyName: 'type' } }
      };

      gen.addService(service, 'message');

      expect(specs.paths['/message'].get.responses[200].content['application/json'].schema)
        .to.deep.equal({
          anyOf: [
            { $ref: '#/components/schemas/otherRef' },
            { $ref: '#/components/schemas/getMessage' }
          ]
        });
      expect(specs.paths['/message/{id}'].get.responses[200].content['application/json'].schema)
        .to.deep.equal({
          oneOf: [
            { $ref: '#/components/schemas/otherRef' },
            { $ref: '#/components/schemas/getMessage' }
          ],
          discriminator: { propertyName: 'type' }
        });
    });

    it('pathParams should be consumed for path parameter', function () {
      const pathParam = {
        description: 'A global path param',
        in: 'path',
        name: 'globalId',
        schema: {
          type: 'string'
        },
        required: true
      };
      service.docs.pathParams = {
        globalId: pathParam
      };

      gen.addService(service, ':globalId/message');

      expect(specs.paths['/{globalId}/message'].get.parameters[0]).to.deep.equal(pathParam);
      expect(specs.paths['/{globalId}/message/{id}'].get.parameters[0]).to.deep.equal(pathParam);
    });

    it('multi option should overwrite determined defaults', () => {
      const specs = {};
      const gen = new OpenApi3Generator(specs, swaggerOptions);
      const multiService = memory({ multi: true });
      multiService.docs = {
        definition: messageDefinition,
        multi: ['remove'],
        operations: {
          find: false,
          get: false,
          create: false,
          update: false,
          patch: false,
          remove: false
        }
      };

      gen.addService(multiService, 'message');

      expect(specs.paths['/message']).to.have.all.keys(['delete']);
    });

    describe('operations', function () {
      it('should overwrite defaults', function () {
        service.docs.operations = {
          find: {
            description: 'custom description'
          }
        };

        gen.addService(service, 'message');

        expect(specs.paths['/message'].get.description).to.equal('custom description');
      });

      it('should remove operation from specs if false', function () {
        service.docs.operations = {
          find: false
        };

        gen.addService(service, 'message');

        expect(specs.paths['/message']).to.be.undefined;
      });

      it('should support path set syntax for nested structures', function () {
        service.docs.operations = {
          find: {
            'parameters[0].description': 'custom description'
          }
        };

        gen.addService(service, 'message');

        expect(specs.paths['/message'].get.parameters[0].description).to.equal('custom description');
      });
    });

    it('idType should be consumed', function () {
      service.docs.idType = 'string';

      gen.addService(service, 'message');

      expect(specs.paths['/message/{id}'].get.parameters[0].schema.type).to.equal('string');
    });

    it('service.id should be consumed', function () {
      service.id = 'slug';
      service.docs.idType = 'string';

      gen.addService(service, 'message');

      expect(specs.paths['/message/{slug}'].get.parameters[0].schema.type).to.equal('string');
    });

    it('idNames should be consumed', function () {
      service.id = 'other'; // will be overruled by idNames
      service.docs.idNames = {
        get: 'slug',
        update: 'uid',
        patch: 'pid',
        remove: 'rid'
      };

      service.update = function () {};
      service.patch = function () {};
      service.remove = function () {};

      gen.addService(service, 'message');

      expect(specs.paths['/message/{slug}'].get.parameters[0].name).to.equal('slug');
      expect(specs.paths['/message/{uid}'].put.parameters[0].name).to.equal('uid');
      expect(specs.paths['/message/{pid}'].patch.parameters[0].name).to.equal('pid');
      expect(specs.paths['/message/{rid}'].delete.parameters[0].name).to.equal('rid');
    });

    describe('array service.id', function () {
      it('array service.id should be consumed', function () {
        const specs = {};
        const gen = new OpenApi3Generator(specs, swaggerOptions);
        const service = memory({ id: ['firstId', 'secondId'] });
        service.docs = {
          definition: messageDefinition
        };

        gen.addService(service, 'message');

        expect(specs.paths['/message/{firstId},{secondId}'].get.parameters[0].schema.type).to.equal('integer');
        expect(specs.paths['/message/{firstId},{secondId}'].get.parameters[1].schema.type).to.equal('integer');
      });

      it('array service.id should be consumed with custom idTypes', function () {
        const specs = {};
        const gen = new OpenApi3Generator(specs, swaggerOptions);
        const service = memory({ id: ['firstId', 'secondId'] });
        service.docs = {
          idType: ['string', 'integer'],
          definition: messageDefinition
        };

        gen.addService(service, 'message');

        expect(specs.paths['/message/{firstId},{secondId}'].get.parameters[0].schema.type).to.equal('string');
        expect(specs.paths['/message/{firstId},{secondId}'].get.parameters[1].schema.type).to.equal('integer');
      });

      it('array service.id should be consumed with custom idNames', function () {
        const specs = {};
        const gen = new OpenApi3Generator(specs, swaggerOptions);
        const service = memory({ id: ['firstId', 'secondId'] });
        service.docs = {
          idType: ['string', 'integer'],
          idNames: {
            update: ['otherId', 'additionalId']
          },
          definition: messageDefinition
        };

        gen.addService(service, 'message');

        expect(specs.paths['/message/{firstId},{secondId}'].get.parameters[0].schema.type).to.equal('string');
        expect(specs.paths['/message/{firstId},{secondId}'].get.parameters[1].schema.type).to.equal('integer');
        expect(specs.paths['/message/{otherId},{additionalId}'].put.parameters[0].schema.type).to.equal('string');
        expect(specs.paths['/message/{otherId},{additionalId}'].put.parameters[1].schema.type).to.equal('integer');
      });

      it('array service.id with custom service.idSeparator should be consumed', function () {
        const specs = {};
        const gen = new OpenApi3Generator(specs, swaggerOptions);
        const service = memory();
        service.options.id = ['firstId', 'secondId'];
        service.options.idSeparator = '|';
        service.docs = {
          definition: messageDefinition
        };

        gen.addService(service, 'message');

        expect(specs.paths['/message/{firstId}|{secondId}'].get.parameters[0].schema.type).to.equal('integer');
        expect(specs.paths['/message/{firstId}|{secondId}'].get.parameters[1].schema.type).to.equal('integer');
      });
    });

    describe('overwriteTagSpec', function () {
      it('nothing should be overwritten by default', function () {
        specs.tags = [
          {
            description: 'My custom defined tag',
            name: 'message'
          }
        ];

        gen.addService(service, 'message');

        expect(specs.tags.length).to.equal(1);
        expect(specs.tags[0]).to.deep.equal({
          description: 'My custom defined tag',
          name: 'message'
        });
      });

      it('overwrite with overwriteTagSpec: true', function () {
        specs.tags = [
          {
            description: 'My custom defined tag',
            name: 'message'
          }
        ];
        service.docs.overwriteTagSpec = true;
        service.docs.description = 'Doc description';

        gen.addService(service, 'message');

        expect(specs.tags.length).to.equal(1);
        expect(specs.tags[0]).to.deep.equal({
          description: 'Doc description',
          name: 'message'
        });
      });
    });
  });

  describe('custom methods', function () {
    let service;
    let gen;
    let specs;

    beforeEach(() => {
      service = {
        find () {},
        docs: {}
      };

      specs = {};

      gen = new OpenApi3Generator(specs, swaggerOptions);
    });

    it('should not generate specs for internal functions that are registered with activateHooks', function () {
      service.methods = { customHooksMethod: ['data', 'params'], unknownMethod: ['params'] }; // emulate activateHooks feathers registration
      service.customHooksMethod = activateHooks(['data, params'])(function () {});

      gen.addService(service, 'message');

      expect(Object.keys(specs.paths).length).to.equal(1);
      expect(Object.keys(specs.paths['/message']).length).to.equal(1);
      expect(specs.paths['/message'].get).to.not.be.undefined; // find method
    });

    it('httpMethod + activateHooks decorated methods should be registered and customizable', function () {
      addCustomMethod(service, { name: 'getMethod', httpMethod: 'GET' });
      service.docs.operations = {
        getMethod: {
          description: 'My test description',
          'response.200.description': 'testcontent'
        }
      };

      gen.addService(service, 'message');

      expect(specs.paths['/message/custom'].get.description).to.equal('My test description');
      expect(specs.paths['/message/custom'].get.response['200'].description).to.equal('testcontent');
    });

    it('defined refs should be used', function () {
      addCustomMethod(service);
      service.docs.refs = {
        customMethodRequest: 'custom_model_request',
        customMethodResponse: 'custom_model_response'
      };

      gen.addService(service, 'message');

      expect(specs.paths['/message/custom'].post.requestBody.content['application/json'].schema.$ref)
        .to.equal('#/components/schemas/custom_model_request');
      expect(specs.paths['/message/custom'].post.responses['200'].content['application/json'].schema.$ref)
        .to.equal('#/components/schemas/custom_model_response');
    });

    it(':__feathersId in path should be handled', function () {
      addCustomMethod(service, { path: '/:__feathersId/custom' });

      gen.addService(service, 'message');

      expect(specs.paths['/message/{id}/custom'].post.parameters[0])
        .to.deep.equal({
          description: 'ID of message',
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'integer'
          }
        });
    });

    it('should handle :__feathersId in path for service.id as array', function () {
      addCustomMethod(service, { path: '/:__feathersId/custom' });

      service.id = ['firstId', 'secondId'];
      service.docs.idType = ['integer', 'string'];

      gen.addService(service, 'message');

      expect(specs.paths['/message/{firstId},{secondId}/custom'].post.parameters[0].schema.type).to.equal('integer');
      expect(specs.paths['/message/{firstId},{secondId}/custom'].post.parameters[1].schema.type).to.equal('string');
    });

    it('custom path parameters should be handled', function () {
      addCustomMethod(service, { path: '/custom/:myId' });

      gen.addService(service, 'message');

      expect(specs.paths['/message/custom/{myId}'].post.parameters[0])
        .to.deep.equal({
          description: 'myId parameter',
          in: 'path',
          name: 'myId',
          required: true,
          schema: {
            type: 'string'
          }
        });
    });

    it('custom method should be omitable from specs with operations[name] = false', function () {
      addCustomMethod(service, { name: 'getMethod', httpMethod: 'GET' });
      service.docs.operations = {
        getMethod: false
      };

      gen.addService(service, 'message');

      expect(specs.paths['/message/custom']).to.be.undefined;
    });
  });
});
