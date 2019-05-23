/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const memory = require('feathers-memory');

const OpenApi2Generator = require('../../lib/v2/generator');

const { addCustomMethod } = require('../helper');

const swaggerOptions = {
  specs: {
    info: {
      title: 'swagger generator v2 tests',
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

describe('swagger v2 generator', function () {
  it('should generate expected specification for memory service', function () {
    const specs = {};
    const gen = new OpenApi2Generator(specs, swaggerOptions);
    const service = memory();
    service.docs = {
      definition: {
        type: 'object',
        properties: {
          content: {
            type: 'string'
          }
        }
      }
    };

    gen.addService(service, 'message');

    expect(specs).to.deep.equal(require('./expected-memory-spec.json'));
  });

  // contains only tests that are v2 specific, tests that test "abstract" generator are part of v3 tests
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

      gen = new OpenApi2Generator(specs, swaggerOptions);
    });

    it('definition should be used for creation of model and list spec schemas', function () {
      service.docs.definition = messageDefinition;

      gen.addService(service, 'message');

      expect(specs.definitions).to.deep.equal({
        message: messageDefinition,
        message_list: {
          items: {
            $ref: '#/definitions/message'
          },
          title: 'message list',
          type: 'array'
        }
      });
    });

    it('definitions should be merged into spec schemas', function () {
      specs.definitions = { already: 'in' };
      service.docs.definitions = {
        self: { any: 'key' }
      };

      gen.addService(service, 'message');

      expect(specs.definitions).to.deep.equal({
        already: 'in',
        self: { any: 'key' }
      });
    });

    it('model should be used for default spec refs and as modelName if not provided', function () {
      service.docs.model = 'own_message';
      service.docs.definition = messageDefinition;

      gen.addService(service, 'message');

      expect(specs.paths['/message'].get.responses[200].schema.$ref).to.equal('#/definitions/own_message_list');
      expect(specs.paths['/message/{id}'].get.responses[200].schema.$ref).to.equal('#/definitions/own_message');
      expect(specs.paths['/message/{id}'].get.parameters[0].description).to.equal('ID of own_message to return');
      expect(specs.definitions).to.deep.equal({
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
            $ref: '#/definitions/own_message'
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

      expect(specs.paths['/message'].get.responses[200].schema.$ref).to.equal('#/definitions/own_message_list');
      expect(specs.paths['/message/{id}'].get.responses[200].schema.$ref).to.equal('#/definitions/own_message');
      expect(specs.paths['/message/{id}'].get.parameters[0].description).to.equal('ID of MessageNiceName to return');
      expect(specs.definitions).to.deep.equal({
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
            $ref: '#/definitions/own_message'
          },
          title: 'MessageNiceName list',
          type: 'array'
        }
      });
    });

    it('refs should be used for schema refs', function () {
      service.docs.refs = {
        findResponse: 'otherRef',
        getResponse: 'getMessage'
      };

      gen.addService(service, 'message');

      expect(specs.paths['/message'].get.responses[200].schema.$ref).to.equal('#/definitions/otherRef');
      expect(specs.paths['/message/{id}'].get.responses[200].schema.$ref).to.equal('#/definitions/getMessage');
    });
  });

  // contains only tests that are v2 specific, tests that test "abstract" generator are part of v3 tests
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

      gen = new OpenApi2Generator(specs, swaggerOptions);
    });

    it('httpMethod + activateHooks decorated methods should be registered', function () {
      addCustomMethod(service, { name: 'getMethod', httpMethod: 'GET' });

      gen.addService(service, 'message');

      expect(specs.paths['/message/custom'].get).to.not.be.undefined;
    });

    it('defined refs should be used', function () {
      addCustomMethod(service);
      service.docs.refs = {
        customMethodRequest: 'custom_model_request',
        customMethodResponse: 'custom_model_response'
      };

      gen.addService(service, 'message');

      expect(specs.paths['/message/custom'].post.parameters[0]).to.deep.equal({
        in: 'body',
        name: 'body',
        required: true,
        schema: {
          $ref: '#/definitions/custom_model_request'
        }
      });
      expect(specs.paths['/message/custom'].post.responses['200'].schema.$ref)
        .to.equal('#/definitions/custom_model_response');
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
          type: 'integer'
        });
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
          type: 'string'
        });
    });
  });
});
