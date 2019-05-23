/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);

const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const memory = require('feathers-memory');
const rp = require('request-promise');
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
        expect(docs.swagger).to.equal('2.0');
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
            openApiVersion: 3,
            docsPath: '/docs',
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

    it('supports basic functionality with a simple app', () => {
      return rp({
        url: 'http://localhost:6776/docs',
        json: true
      }).then(docs => {
        expect(docs.openapi).to.equal('3.0.2');
        expect(docs.info.title).to.equal('A test');
        expect(docs.info.description).to.equal('A description');
        expect(docs.paths['/messages']).to.exist;
      });
    });

    it('serves json specification at docJsonPath', () => {
      return rp({
        url: 'http://localhost:6776/docs.json'
      }).then(response => {
        const docs = JSON.parse(response);
        expect(docs.openapi).to.equal('3.0.2');
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
        expect(messagesIdParam.schema.type).to.equal('string');
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

  describe('uiIndex option and "text/html" requests', () => {
    let server;
    let messageService;

    const startServiceWithUiIndex = (uiIndex) => {
      const app = express(feathers())
        .configure(express.rest())
        .configure(
          swagger({
            docsPath: '/docs',
            uiIndex,
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

      return new Promise(resolve => {
        server = app.listen(6776, () => resolve());
      });
    };

    before(done => {
      messageService = memory();
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

      done();
    });

    afterEach(done => server.close(done));

    it('should serve json for: undefined', async () => {
      await startServiceWithUiIndex(undefined);

      const responseContent = await rp({
        url: 'http://localhost:6776/docs',
        headers: {
          'Accept': 'text/html'
        }
      });

      const docs = JSON.parse(responseContent);

      expect(docs.swagger).to.equal('2.0');
      expect(docs.info.title).to.equal('A test');
      expect(docs.info.description).to.equal('A description');
      expect(docs.paths['/messages']).to.exist;
      // check static assets of SwaggerUI are not served
      const staticAssetResponse = await rp({
        url: 'http://localhost:6776/docs/swagger-ui.css',
        resolveWithFullResponse: true,
        simple: false
      });
      expect(staticAssetResponse.statusCode).to.equal(404);
    });

    it('should serve default SwaggerUI for: true', async () => {
      await startServiceWithUiIndex(true);

      const expectedResponse = await readFile(
        path.join(__dirname, '..', 'node_modules', 'swagger-ui-dist', 'index.html'),
        { encoding: 'utf8' }
      );

      const responseContent = await rp({
        url: 'http://localhost:6776/docs/',
        headers: {
          'Accept': 'text/html'
        },
        followRedirect (response) {
          expect(response.statusCode).to.equal(302);
          expect(response.headers.location).to.equal('?url=/docs');
          return true;
        }
      });

      expect(responseContent).to.equal(expectedResponse);
      // check some static assets of SwaggerUI
      expect(await rp({ url: 'http://localhost:6776/docs/swagger-ui.css' })).to.exist;
      expect(await rp({ url: 'http://localhost:6776/docs/swagger-ui-bundle.js' })).to.exist;
    });

    it('should serve provided file for: string', async () => {
      const docFilePath = path.join(__dirname, '..', 'example', 'docs.html');

      await startServiceWithUiIndex(docFilePath);

      const expectedResponse = await readFile(docFilePath, { encoding: 'utf8' });

      const responseContent = await rp({
        url: 'http://localhost:6776/docs',
        headers: {
          'Accept': 'text/html'
        }
      });

      expect(responseContent).to.equal(expectedResponse);
      // check some static assets of SwaggerUI
      expect(await rp({ url: 'http://localhost:6776/docs/swagger-ui.css' })).to.exist;
      expect(await rp({ url: 'http://localhost:6776/docs/swagger-ui-bundle.js' })).to.exist;
    });

    it('should use function to serve for: function', async () => {
      const simple = (req, res) => {
        res.send('TEST BODY');
      };

      await startServiceWithUiIndex(simple);

      const responseContent = await rp({
        url: 'http://localhost:6776/docs',
        headers: {
          'Accept': 'text/html'
        }
      });

      expect(responseContent).to.equal('TEST BODY');
      // check some static assets of SwaggerUI
      expect(await rp({ url: 'http://localhost:6776/docs/swagger-ui.css' })).to.exist;
      expect(await rp({ url: 'http://localhost:6776/docs/swagger-ui-bundle.js' })).to.exist;
    });
  });
});
