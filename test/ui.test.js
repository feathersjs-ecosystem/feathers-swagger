/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);

const axios = require('axios').default;
const memory = require('feathers-memory');
const proxyquire = require('proxyquire');

const swagger = require('../lib');
const swaggerUI = require('../lib/swagger-ui-dist');
const { startFeathersApp, koaApp, expressApp, isFeathers4 } = require('./helper');

describe('feathers-swagger.swaggerUI', () => {
  Object.entries({
    koa: { initApp: koaApp },
    express: { initApp: expressApp }
  }).forEach(([type, options]) => {
    if (type === 'koa' && isFeathers4) {
      return;
    }

    const { initApp } = options;
    describe(`when using ${type}`, () => {
      let app;
      let appTeardown;
      let messageService;

      const startServiceWithUi = (ui) => {
        app = initApp()
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

        return startFeathersApp(app, 6776).then(teardown => { appTeardown = teardown; });
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

      afterEach(function (done) {
        this.timeout(10000);
        appTeardown(() => done());
      });

      ['/docs', '/docs/'].forEach((requestPath) => {
        it(`should serve default SwaggerUI under ${requestPath}`, async () => {
          await startServiceWithUi(swaggerUI());

          const expectedResponse = await readFile(
            path.join(__dirname, '..', 'node_modules', 'swagger-ui-dist', 'index.html'),
            { encoding: 'utf8' }
          );

          const { data: responseContent } = await axios.get(
            `http://localhost:6776${requestPath}`,
            {
              headers: {
                Accept: 'text/html'
              }
            }
          );

          expect(responseContent).to.equal(expectedResponse);
          // check json path is set in initializer script
          const { data: initializerContent } = await axios.get('http://localhost:6776/docs/swagger-initializer.js');

          expect(initializerContent).contains('url: "/swagger.json"');

          // check some static assets of SwaggerUI
          expect((await axios.get('http://localhost:6776/docs/swagger-ui.css')).status).to.equal(200);
          expect((await axios.get('http://localhost:6776/docs/swagger-ui-bundle.js')).status).to.equal(200);
        });
      });

      it('should serve default SwaggerUI under /customPath', async () => {
        await startServiceWithUi(swaggerUI({ docsPath: '/customPath' }));

        const expectedResponse = await readFile(
          path.join(__dirname, '..', 'node_modules', 'swagger-ui-dist', 'index.html'),
          { encoding: 'utf8' }
        );

        const { data: responseContent } = await axios.get(
          'http://localhost:6776/customPath/',
          {
            headers: {
              Accept: 'text/html'
            }
          }
        );

        expect(responseContent).to.equal(expectedResponse);
        // check some static assets of SwaggerUI
        expect((await axios.get('http://localhost:6776/customPath/swagger-ui.css')).status).to.equal(200);
        expect((await axios.get('http://localhost:6776/customPath/swagger-ui-bundle.js')).status)
          .to.equal(200);
      });

      it('should serve provided absolute indexFile', async () => {
        const docFilePath = path.join(__dirname, '..', 'example', 'docs.html');

        await startServiceWithUi(swaggerUI({ indexFile: docFilePath }));

        const expectedResponse = await readFile(docFilePath, { encoding: 'utf8' });

        const { data: responseContent } = await axios.get(
          'http://localhost:6776/docs/',
          {
            headers: {
              Accept: 'text/html'
            }
          }
        );

        expect(responseContent).to.equal(expectedResponse);
        // check some static assets of SwaggerUI
        expect((await axios.get('http://localhost:6776/docs/swagger-ui.css')).status).to.equal(200);
        expect((await axios.get('http://localhost:6776/docs/swagger-ui-bundle.js')).status).to.equal(200);
      });

      it('should serve provided relative indexFile', async () => {
        const docFilePath = path.join('example', 'docs.html');

        await startServiceWithUi(swaggerUI({ indexFile: docFilePath }));

        const expectedResponse = await readFile(docFilePath, { encoding: 'utf8' });

        const { data: responseContent } = await axios.get(
          'http://localhost:6776/docs/',
          {
            headers: {
              Accept: 'text/html'
            }
          }
        );

        expect(responseContent).to.equal(expectedResponse);
        // check some static assets of SwaggerUI
        expect((await axios.get('http://localhost:6776/docs/swagger-ui.css')).status).to.equal(200);
        expect((await axios.get('http://localhost:6776/docs/swagger-ui-bundle.js')).status).to.equal(200);
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

        const { data: initializerContent } = await axios.get('http://localhost:6776/docs/swagger-initializer.js');

        expect(initializerContent).to.equal('custom initializer js');
        // check some static assets of SwaggerUI
        expect((await axios.get('http://localhost:6776/docs/swagger-ui.css')).status).to.equal(200);
        expect((await axios.get('http://localhost:6776/docs/swagger-ui-bundle.js')).status).to.equal(200);
      });

      it('should respect x-forwarded-prefix header', async () => {
        const headers = { 'X-FORWARDED-PREFIX': '/redirect-prefix' };

        await startServiceWithUi(swaggerUI());

        // check the redirect using the prefix
        const axiosResponse = await axios.get('http://localhost:6776/docs', {
          headers,
          maxRedirects: 0,
          validateStatus: (resStatus) => resStatus === 302
        });
        expect(axiosResponse.headers.location).equals('/redirect-prefix/docs/');

        // check json path is set in initializer script
        const { data: initializerContent } = await axios.get(
          'http://localhost:6776/docs/swagger-initializer.js',
          { headers }
        );

        expect(initializerContent).contains('url: "/redirect-prefix/swagger.json"');
      });
    });
  });

  it('should fail with docsPath that contains a trailing slash', () => {
    expect(() => swaggerUI({ docsPath: '/docs/' }))
      .to.throw(Error, 'swaggerUI.docsPath must not contain a trailing slash');
  });

  describe('when koa packages are missing', () => {
    if (isFeathers4) {
      return;
    }

    ['koa-static', 'koa-mount'].forEach((packageName) => {
      it(`should fail with missing ${packageName} package`, () => {
        const swaggerUIWithMockedDependencies = proxyquire('../lib/swagger-ui-dist', {
          './helpers': proxyquire('../lib/helpers', { [packageName]: null })
        });

        const app = koaApp();
        expect(() => {
          app.configure(swagger({
            ui: swaggerUIWithMockedDependencies(),
            specs: {
              info: {
                title: 'A test',
                description: 'A description',
                version: '1.0.0'
              }
            }
          }));
        }).to.throw(
          Error,
          `Package ${packageName} has to be installed to use Swagger UI with koa`
        );
      });
    });
  });

  it('should throw error if swagger-ui-dist is not installed', async () => {
    const swaggerUIWrongUiDistVersion = proxyquire('../lib/swagger-ui-dist', {
      'swagger-ui-dist': {
        getAbsoluteFSPath: () => __dirname
      },
      'swagger-ui-dist/package.json': { version: '4.0.0' }
    });

    expect(() => swaggerUIWrongUiDistVersion())
      .to
      .throw(
        Error,
        'swagger-ui-dist has to be installed in a version >= 4.9.0 when using feathers-swagger.swaggerUI function'
      );
  });
});
