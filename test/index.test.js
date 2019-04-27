/* eslint-disable no-unused-expressions */
const { expect, assert } = require('chai');

const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const memory = require('feathers-memory');
const rp = require('request-promise');
const SwaggerParser = require('swagger-parser');
const swagger = require('../lib');

describe('feathers-swagger', () => {
  describe('basic functionality', () => {
    let server;

    before(done => {
      const messageService = memory();
      messageService.docs = {
        description: 'A service to send and receive messages',
        definition: {
          'type': 'object',
          'required': [
            'text'
          ],
          'properties': {
            'text': {
              'type': 'string',
              'description': 'The message text'
            },
            'userId': {
              'type': 'string',
              'description': 'The id of the user that sent the message'
            }
          }
        }
      };

      const app = express(feathers())
        .configure(express.rest())
        .configure(
          swagger({
            docsPath: '/docs',
            idType: 'string',
            specs: {
              info: {
                title: 'A test',
                description: 'A description',
                version: '1.0.0'
              }
            }
          })
        )
        .use('/messages', messageService);

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

    it('check swagger document validity', () => {
      let swaggerSpec;
      return rp({
        url: 'http://localhost:6776/docs',
        json: true
      }).then(docs => {
        swaggerSpec = docs;
        return SwaggerParser.validate(docs);
      })
        .then(api => {
          expect(api).to.exist;
        })
        .catch(error => {
          assert.fail(`${error.message}\n\nJSON:\n${JSON.stringify(swaggerSpec, undefined, 2)}`);
        });
    });
  });
});
