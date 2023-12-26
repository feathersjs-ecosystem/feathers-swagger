/* eslint-disable no-unused-expressions */
const express = require('@feathersjs/express');
const axios = require('axios').default;
const { expect } = require('chai');

let bodyParser;
const { startFeathersApp, koaApp, expressApp, isFeathers4 } = require('./helper');
const swagger = require('../lib');
const proxyquire = require('proxyquire');

if (!isFeathers4) {
  bodyParser = require('@feathersjs/koa').bodyParser;
}

const { customMethodsHandler, customMethod } = swagger;

const startFeathersWithService = (initApp, service, methods) => {
  const app = initApp()
    .configure(swagger({
      specs: {
        info: {
          title: 'A test',
          description: 'A description',
          version: '1.0.0'
        }
      }
    }))
    .use('/service', service, { methods });

  return startFeathersApp(app, 6776);
};

describe('feathers 5 custom methods', () => {
  if (isFeathers4) {
    return;
  }

  Object.entries({
    koa: {
      initApp: () => {
        return koaApp((app) => {
          app.use(bodyParser())
            .configure(customMethodsHandler);
        });
      }
    },
    express: {
      initApp: () => {
        return expressApp((app) => {
          app.use(express.json())
            .use(express.urlencoded({
              extended: true
            }))
            .configure(customMethodsHandler)
          ;
        });
      }
    }
  }).forEach(([type, options]) => {
    describe(`using customMethodsHandler with ${type}`, () => {
      const { initApp } = options;

      let appTeardown;

      afterEach(done => appTeardown(() => done()));

      it('should handle simple post method', async () => {
        const customService = {
          async find (params) {
            return { queryParams: params.query };
          },
          getVersion: customMethod('POST', '/getVersion')(async (data, params) => {
            return { method: 'getVersion', data, queryParams: params.query, routeParams: params.params };
          })
        };

        appTeardown = await startFeathersWithService(initApp, customService, ['find', 'getVersion']);

        const { data: responseContent } = await axios.post(
          'http://localhost:6776/service/getVersion?param=abc',
          {
            example: 'super'
          }
        );

        expect(responseContent).to.deep.equal({
          method: 'getVersion',
          data: { example: 'super' },
          queryParams: { param: 'abc' },
          routeParams: {}
        });
      });

      it('should handle get method with id', async () => {
        const customService = {
          async find (params) {
            return { queryParams: params.query };
          },
          getVersion: customMethod('GET', '/:customId/version')(async (data, params) => {
            return { method: 'getVersion', data, queryParams: params.query, routeParams: params.params };
          })
        };

        appTeardown = await startFeathersWithService(initApp, customService, ['find', 'getVersion']);

        const { data: responseContent } = await axios.get('http://localhost:6776/service/5/version?param=abc');

        expect(responseContent).to.deep.equal({
          method: 'getVersion',
          data: {},
          queryParams: { param: 'abc' },
          routeParams: { customId: '5' }
        });
      });

      it('should handle get method with feathers id', async () => {
        const customService = {
          async find (params) {
            return { queryParams: params.query };
          },

          getVersion: customMethod('GET', '/:__id/version')(async (data, params) => {
            return { method: 'getVersion', data, queryParams: params.query, routeParams: params.params };
          })
        };

        appTeardown = await startFeathersWithService(initApp, customService, ['find', 'getVersion']);

        const { data: responseContent } = await axios.get('http://localhost:6776/service/5/version?param=abc');

        expect(responseContent).to.deep.equal({
          method: 'getVersion',
          data: {},
          queryParams: { param: 'abc' },
          routeParams: { __id: '5' }
        });
      });

      it('should handle put method with id', async () => {
        const customService = {
          async find (params) {
            return { queryParams: params.query };
          },
          setVersion: customMethod('PUT', '/:customId/version')(async (data, params) => {
            return { method: 'setVersion', data, queryParams: params.query, routeParams: params.params };
          })
        };

        appTeardown = await startFeathersWithService(initApp, customService, ['find', 'setVersion']);

        const { data: responseContent } = await axios.put(
          'http://localhost:6776/service/5/version?param=abc',
          { example: 'put' }
        );

        expect(responseContent).to.deep.equal({
          method: 'setVersion',
          data: { example: 'put' },
          queryParams: { param: 'abc' },
          routeParams: { customId: '5' }
        });
      });

      it('should handle patch method with id', async () => {
        const customService = {
          async find (params) {
            return { queryParams: params.query };
          },
          setVersion: customMethod('PATCH', '/:customId/version')(async (data, params) => {
            return { method: 'setVersion', data, queryParams: params.query, routeParams: params.params };
          })
        };

        appTeardown = await startFeathersWithService(initApp, customService, ['find', 'setVersion']);

        const { data: responseContent } = await axios.patch(
          'http://localhost:6776/service/5/version?param=abc',
          { example: 'patch' }
        );

        expect(responseContent).to.deep.equal({
          method: 'setVersion',
          data: { example: 'patch' },
          queryParams: { param: 'abc' },
          routeParams: { customId: '5' }
        });
      });

      it('should handle delete method with id', async () => {
        const customService = {
          async find (params) {
            return { queryParams: params.query };
          },
          removeVersion: customMethod('DELETE', '/:customId/version')(async (data, params) => {
            return { method: 'removeVersion', data, queryParams: params.query, routeParams: params.params };
          })
        };

        appTeardown = await startFeathersWithService(initApp, customService, ['find', 'removeVersion']);

        const { data: responseContent } = await axios.delete(
          'http://localhost:6776/service/5/version?param=abc'
        );

        expect(responseContent).to.deep.equal({
          method: 'removeVersion',
          data: {},
          queryParams: { param: 'abc' },
          routeParams: { customId: '5' }
        });
      });
    });
  });

  describe('with missing dependencies', () => {
    it('customMethodsHandler with koa should fail', () => {
      const { customMethodsHandler } = proxyquire('../lib/custom-methods', {
        './helpers': proxyquire('../lib/helpers', { '@koa/router': null })
      });

      const app = koaApp();
      expect(() => {
        app.configure(customMethodsHandler);
      }).to.throw(Error, 'Package @koa/router has to be installed to use the customMethodsHandler');
    });
  });

  describe('without customMethodsHandler', () => {
    let appTeardown;
    let app;

    const initApp = () => {
      return koaApp((appArg) => {
        app = appArg;
        app.use(bodyParser());
      });
    };

    afterEach(done => { appTeardown(() => { done(); app = undefined; }); });

    it('should not fail and don\'t add custom methods to open api specs', async () => {
      const customService = {
        async find (params) {
          return { queryParams: params.query };
        },
        getVersion: customMethod('POST', '/getVersion')(async (data, params) => {
          return { method: 'getVersion', data, queryParams: params.query, routeParams: params.params };
        })
      };

      appTeardown = await startFeathersWithService(initApp, customService, ['find', 'getVersion']);

      try {
        await axios.post(
          'http://localhost:6776/service/getVersion?param=abc',
          {
            example: 'super'
          }
        );
        expect.fail('an error response is expected');
      } catch (e) {
        expect(e).to.be.instanceof(Error);
      }

      expect(app.docs.paths['/service/getVersion']).to.not.exist;
    });
  });
});
