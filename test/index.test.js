/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const axios = require('axios').default;
const memory = require('feathers-memory');
const SwaggerParser = require('swagger-parser');
const swagger = require('../lib');
const { feathers, startFeathersApp, koaApp, expressApp, isFeathers4 } = require('./helper');

describe('feathers-swagger', () => {
  describe('serve spec file', () => {
    Object.entries({
      koa: { initApp: koaApp },
      express: { initApp: expressApp }
    }).forEach(([type, options]) => {
      if (type === 'koa' && isFeathers4) {
        return;
      }

      const { initApp } = options;

      describe(`serve openapi json file with ${type}`, () => {
        let server;
        let app;

        const startApp = (swaggerConfig) => {
          app = initApp();

          app.configure(swagger({
            specs: {
              info: {
                title: 'A test',
                description: 'A description',
                version: '1.0.0'
              }
            },
            ...swaggerConfig
          }));

          return startFeathersApp(app, 6776).then((res) => { server = res; });
        };

        afterEach(done => server.close(done));

        it('default as /swagger.json', async () => {
          await startApp({});

          expect((await axios.get('http://localhost:6776/swagger.json')).data).to.deep.equal(app.docs);
        });

        it('use `docsJsonPath` as /docs.json', async () => {
          await startApp({ docsJsonPath: '/docs.json' });

          expect((await axios.get('http://localhost:6776/docs.json')).data).to.deep.equal(app.docs);
          await axios.get('http://localhost:6776/swagger.json')
            .catch(error => expect(error.response).to.have.property('status', 404));
        });
      });
    });
  });

  describe('basic functionality with openapi v2', () => {
    let app;

    before(() => {
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

      app = feathers()
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
    });

    it('supports basic functionality with a simple app', () => {
      expect(app.docs.swagger).to.equal('2.0');
      expect(app.docs.info.title).to.equal('A test');
      expect(app.docs.info.description).to.equal('A description');
      expect(app.docs.paths['/messages']).to.exist;
    });

    it('supports id types in config', () => {
      const messagesIdParam = app.docs.paths['/messages/{id}'].get.parameters[0];
      expect(messagesIdParam.type).to.equal('string');
    });

    it('check swagger document validity', () => {
      SwaggerParser.validate(app.docs)
        .then(api => {
          expect(api).to.exist;
        })
        .catch(error => {
          expect.fail(`${error.message}\n\nJSON:\n${JSON.stringify(app.docs, undefined, 2)}`);
        });
    });
  });

  describe('basic functionality with openapi v3', () => {
    let app;

    before(() => {
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

      app = feathers()
        .configure(
          swagger({
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
    });

    it('serves json specification at docJsonPath', () => {
      expect(app.docs.openapi).to.equal('3.0.3');
      expect(app.docs.info.title).to.equal('A test');
      expect(app.docs.info.description).to.equal('A description');
      expect(app.docs.paths['/messages']).to.exist;
    });

    it('supports id types in config', () => {
      const messagesIdParam = app.docs.paths['/messages/{id}'].get.parameters[0];
      expect(messagesIdParam.schema.type).to.equal('string');
    });

    it('check swagger document validity', () => {
      return SwaggerParser.validate(app.docs)
        .then(api => {
          expect(api).to.exist;
        })
        .catch(error => {
          expect.fail(`${error.message}\n\nJSON:\n${JSON.stringify(app.docs, undefined, 2)}`);
        });
    });
  });

  it('fails with invalid openApiVersion', () => {
    const app = feathers();
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
      const app = feathers()
        .configure(swagger({ specs }));

      expect(app.docs.info).to.deep.equal(specs.info);
    });

    it('can be specified', () => {
      const app = feathers()
        .configure(swagger({ specs, appProperty: 'swaggerSpecs' }));

      expect(app.swaggerSpecs.info).to.deep.equal(specs.info);
      expect(app.docs).to.not.exist;
    });

    it('can be disabled', () => {
      const app = feathers()
        .configure(swagger({ specs, appProperty: '' }));

      expect(app.docs).to.not.exist;
    });
  });
});
