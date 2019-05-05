/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const { operation, tag, security } = require('../lib/utils');

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

    it('should provide spec defaults for empty service.docs[method] and defaults', () => {
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

    it('should prefer prefer method.docs over service.docs[method]', () => {
      const service = {
        docs: {
          find: {
            description: 'description of docs.find',
            summary: 'only from docs.find'
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
        summary: 'only from docs.find',
        tags: defaults.tags,
        consumes: defaults.consumes,
        produces: defaults.produces,
        security: defaults.security
      });
      expect(service.docs.find, 'service.doc[method] should be cleaned up').to.be.undefined;
    });

    it('should support setting of nested path keys', () => {
      const service = {
        docs: {
          find: {
            description: 'description of docs.find',
            'nested.added': 'key'
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

    it('should return security definitions array when __all methods should be secured', () => {
      expect(security('create', ['__all'], securityDefinitions)).to.equals(securityDefinitions);
    });
  });
});
