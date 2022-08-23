/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const axios = require('axios').default;
const memory = require('feathers-memory');
const SwaggerParser = require('swagger-parser');
const swagger = require('../lib');

describe('feathers-swagger', () => {
  describe('basic functionality with openapi v2', () => {
    let server;

    before(done => {
      const messageService = memory();
      messageService.docs = {
        description: 'A service to send and receive messages',
        definition: {
          type: 'object',
          required: [
            'text'
          ],
          properties: {
            text: {
              type: 'string',
              description: 'The message text'
            },
            userId: {
              type: 'string',
              description: 'The id of the user that sent the message'
            }
          }
        }
      };

      const app = express(feathers())
        .configure(express.rest())
        .configure(
          swagger({
            openApiVersion: 2,
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
      return axios.get('http://localhost:6776/swagger.json').then(({ data: docs }) => {
        expect(docs.swagger).to.equal('2.0');
        expect(docs.info.title).to.equal('A test');
        expect(docs.info.description).to.equal('A description');
        expect(docs.paths['/messages']).to.exist;
      });
    });

    it('supports id types in config', () => {
      return axios.get('http://localhost:6776/swagger.json').then(({ data: docs }) => {
        const messagesIdParam = docs.paths['/messages/{id}'].get.parameters[0];
        expect(messagesIdParam.type).to.equal('string');
      });
    });

    it('check swagger document validity', () => {
      let swaggerSpec;
      return axios.get('http://localhost:6776/swagger.json').then(({ data: docs }) => {
        swaggerSpec = docs;
        return SwaggerParser.validate(docs);
      })
        .then(api => {
          expect(api).to.exist;
        })
        .catch(error => {
          expect.fail(`${error.message}\n\nJSON:\n${JSON.stringify(swaggerSpec, undefined, 2)}`);
        });
    });
  });

  describe('basic functionality with openapi v3', () => {
    let server;

    before(done => {
      const messageService = memory();
      messageService.docs = {
        description: 'A service to send and receive messages',
        definition: {
          type: 'object',
          required: [
            'text'
          ],
          properties: {
            text: {
              type: 'string',
              description: 'The message text'
            },
            userId: {
              type: 'string',
              description: 'The id of the user that sent the message'
            }
          }
        }
      };

      const app = express(feathers())
        .configure(express.rest())
        .configure(
          swagger({
            docsJsonPath: '/docs.json',
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

    it('serves json specification at docJsonPath', () => {
      return axios.get('http://localhost:6776/docs.json').then(({ data: docs }) => {
        expect(docs.openapi).to.equal('3.0.2');
        expect(docs.info.title).to.equal('A test');
        expect(docs.info.description).to.equal('A description');
        expect(docs.paths['/messages']).to.exist;
      });
    });

    it('supports id types in config', () => {
      return axios.get('http://localhost:6776/docs.json').then(({ data: docs }) => {
        const messagesIdParam = docs.paths['/messages/{id}'].get.parameters[0];
        expect(messagesIdParam.schema.type).to.equal('string');
      });
    });

    it('check swagger document validity', () => {
      let swaggerSpec;
      return axios.get('http://localhost:6776/docs.json').then(({ data: docs }) => {
        swaggerSpec = docs;
        return SwaggerParser.validate(docs);
      })
        .then(api => {
          expect(api).to.exist;
        })
        .catch(error => {
          expect.fail(`${error.message}\n\nJSON:\n${JSON.stringify(swaggerSpec, undefined, 2)}`);
        });
    });
  });

  it('fails with invalid openApiVersion', () => {
    const app = express(feathers())
      .configure(express.rest());
    expect(() => app.configure(swagger({ openApiVersion: 1 })))
      .to.throw(Error, 'Unsupported openApiVersion 1! Allowed: 2, 3');
  });

  describe('appProperty', () => {
    const specs = {
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0'
      }
    };

    it('should be docs by default', () => {
      const app = express(feathers())
        .configure(swagger({ specs }));

      expect(app.docs.info).to.deep.equal(specs.info);
    });

    it('can be specified', () => {
      const app = express(feathers())
        .configure(swagger({ specs, appProperty: 'swaggerSpecs' }));

      expect(app.swaggerSpecs.info).to.deep.equal(specs.info);
      expect(app.docs).to.not.exist;
    });

    it('can be disabled', () => {
      const app = express(feathers())
        .configure(swagger({ specs, appProperty: '' }));

      expect(app.docs).to.not.exist;
    });
  });
});
