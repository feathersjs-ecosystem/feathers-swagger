/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const buzzard = require('@feathersjs/feathers');
const expressify = require('@feathersjs/express');
const feathers = require('feathers');
const rest = require('feathers-rest');
const memory = require('feathers-memory');
const rp = require('request-promise');
const swagger = require('../lib');

describe('feathers-swagger', () => {
  describe('basic functionality', () => {
    let server;

    before(done => {
      const app = feathers()
        .configure(rest())
        .configure(swagger({
          docsPath: '/docs',
          info: {
            'title': 'A test',
            'description': 'A description',
            'version': '1.0.0'
          },
          ignore: {
            tags: []
          }
        }))
        .use('/messages', memory());

      server = app.listen(6776, () => done());
    });

    after(done => server.close(done));

    it('supports basic functionality with a simple app', () => {
      return rp({
        url: 'http://localhost:6776/docs',
        json: true
      }).then(docs => {
        expect(docs.info.title).to.equal('A test');
        expect(docs.info.description).to.equal('A description');
        expect(docs.info.version).to.equal('1.0.0');
        expect(docs.paths['/messages']).to.exist;
      });
    });
  });

  describe('support for Buzzard', () => {
    it('should support Buzzard provider syntax', () => {
      const app = expressify(buzzard())
        .configure(swagger({}))
        .use('/messages', memory());

      return new Promise((resolve, reject) => {
        const server = app.listen(9001, () => {
          resolve(server.close());
        });
      });
    });
  });
});
