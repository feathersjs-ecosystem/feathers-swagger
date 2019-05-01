/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const { operation } = require('../lib/utils');

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
});
