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
const mock = require('mock-require');
const swagger = require('../lib');
const swaggerUI = require('../lib/swagger-ui-dist');

describe('feathers-swagger ui option', () => {
  describe('using swaggerUI', () => {
    let server;
    let messageService;

    const startServiceWithUi = (ui) => {
      const app = express(feathers())
        .configure(express.rest())
        .configure(
          swagger({
            docsPath: '/docs',
            ui,
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

      done();
    });

    afterEach(done => server.close(done));

    it('should serve default SwaggerUI under /docs', async () => {
      await startServiceWithUi(swaggerUI());

      const expectedResponse = await readFile(
        path.join(__dirname, '..', 'node_modules', 'swagger-ui-dist', 'index.html'),
        { encoding: 'utf8' }
      );

      const responseContent = await rp({
        url: 'http://localhost:6776/docs/',
        headers: {
          Accept: 'text/html'
        }
      });

      expect(responseContent).to.equal(expectedResponse);
      // check json path is set in initializer script
      const initializerContent = await rp({
        url: 'http://localhost:6776/docs/swagger-initializer.js'
      });

      expect(initializerContent).contains('url: "/swagger.json"');

      // check some static assets of SwaggerUI
      expect(await rp({ url: 'http://localhost:6776/docs/swagger-ui.css' })).to.exist;
      expect(await rp({ url: 'http://localhost:6776/docs/swagger-ui-bundle.js' })).to.exist;
    });

    it('should serve default SwaggerUI under /customPath', async () => {
      await startServiceWithUi(swaggerUI({ docsPath: '/customPath' }));

      const expectedResponse = await readFile(
        path.join(__dirname, '..', 'node_modules', 'swagger-ui-dist', 'index.html'),
        { encoding: 'utf8' }
      );

      const responseContent = await rp({
        url: 'http://localhost:6776/customPath/',
        headers: {
          Accept: 'text/html'
        }
      });

      expect(responseContent).to.equal(expectedResponse);
      // check some static assets of SwaggerUI
      expect(await rp({ url: 'http://localhost:6776/customPath/swagger-ui.css' })).to.exist;
      expect(await rp({ url: 'http://localhost:6776/customPath/swagger-ui-bundle.js' })).to.exist;
    });

    it('should serve provided indexFile', async () => {
      const docFilePath = path.join(__dirname, '..', 'example', 'docs.html');

      await startServiceWithUi(swaggerUI({ indexFile: docFilePath }));

      const expectedResponse = await readFile(docFilePath, { encoding: 'utf8' });

      const responseContent = await rp({
        url: 'http://localhost:6776/docs',
        headers: {
          Accept: 'text/html'
        }
      });

      expect(responseContent).to.equal(expectedResponse);
      // check some static assets of SwaggerUI
      expect(await rp({ url: 'http://localhost:6776/docs/swagger-ui.css' })).to.exist;
      expect(await rp({ url: 'http://localhost:6776/docs/swagger-ui-bundle.js' })).to.exist;
    });

    it('should use custom initializer', async () => {
      const getSwaggerInitializerScript = ({ docsPath, docsJsonPath, specs }) => {
        // check params given to initializer script
        expect(docsPath).to.exist;
        expect(docsJsonPath).to.exist;
        expect(specs).to.exist;

        return 'custom initializer js';
      };

      await startServiceWithUi(swaggerUI({ getSwaggerInitializerScript }));

      const initializerContent = await rp({
        url: 'http://localhost:6776/docs/swagger-initializer.js'
      });

      expect(initializerContent).to.equal('custom initializer js');
      // check some static assets of SwaggerUI
      expect(await rp({ url: 'http://localhost:6776/docs/swagger-ui.css' })).to.exist;
      expect(await rp({ url: 'http://localhost:6776/docs/swagger-ui-bundle.js' })).to.exist;
    });
  });

  describe('swagger-ui-dist not installed', () => {
    before(() => {
      mock('swagger-ui-dist', './mock/swagger-ui-dist');
      mock('swagger-ui-dist/package.json', { version: '4.0.0' });
    });

    after(() => {
      mock.stop('swagger-ui-dist');
      mock.stop('swagger-ui-dist/package.json');
    });

    it('throws error if swagger-ui-dist is not installed', async () => {
      expect(() => swaggerUI()).to.throw(Error, 'swagger-ui-dist has to be installed in a version >= 4.9.0 when using feathers-swagger.swaggerUI function');
    });
  });
});
