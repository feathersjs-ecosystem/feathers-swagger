/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const memory = require('feathers-memory');
const rp = require('request-promise');
const swagger = require('../lib');

describe('feathers-swagger', () => {
  describe('basic functionality', () => {
    let server;

    before(done => {
      const app = express(feathers())
        .configure(express.rest())
        .configure(
          swagger({
            docsPath: '/docs',
            info: {
              title: 'A test',
              description: 'A description'
            },
            idType: 'string'
          })
        )
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
        expect(docs.paths['/messages']).to.exist;
      });
    });

    it('supports id types in config', () => {
      return rp({
        url: 'http://localhost:6776/docs',
        json: true
      }).then(docs => {
        const messagesIdParam = docs.paths['/messages/{id}'].get.parameters[0];
        expect(messagesIdParam.type).to.equal('string');
      });
    });
  });
});
