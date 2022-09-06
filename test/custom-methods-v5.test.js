const express = require('@feathersjs/express');
const { bodyParser } = require('@feathersjs/koa');
const axios = require('axios').default;
const { expect } = require('chai');

const { startFeathersApp, koaApp, expressApp, isFeathers4 } = require('./helper');
const swagger = require('../lib');
const proxyquire = require('proxyquire');

const { customMethodsHandler, customMethod } = swagger;

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
  describe(`custom http methods with ${type}`, () => {
    if (isFeathers4) {
      return; // only valid with feathers 5
    }

    const { initApp } = options;

    let server;

    const startFeathersWithService = (service, methods) => {
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

      return startFeathersApp(app, 6776).then((res) => { server = res; });
    };

    afterEach(done => server.close(done));

    it('simple post method should be callable', async () => {
      const customService = {
        async find (params) {
          return { queryParams: params.query };
        },
        getVersion: customMethod('POST', '/getVersion')(async (data, params) => {
          return { method: 'getVersion', data, queryParams: params.query, routeParams: params.params };
        })
      };

      await startFeathersWithService(customService, ['find', 'getVersion']);

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

    it('get method with id should be callable', async () => {
      const customService = {
        async find (params) {
          return { queryParams: params.query };
        },
        getVersion: customMethod('GET', '/:customId/version')(async (data, params) => {
          return { method: 'getVersion', data, queryParams: params.query, routeParams: params.params };
        })
      };

      await startFeathersWithService(customService, ['find', 'getVersion']);

      const { data: responseContent } = await axios.get('http://localhost:6776/service/5/version?param=abc');

      expect(responseContent).to.deep.equal({
        method: 'getVersion',
        data: {},
        queryParams: { param: 'abc' },
        routeParams: { customId: '5' }
      });
    });

    it('get method with feathers id should be callable', async () => {
      const customService = {
        async find (params) {
          return { queryParams: params.query };
        },

        getVersion: customMethod('GET', '/:__id/version')(async (data, params) => {
          return { method: 'getVersion', data, queryParams: params.query, routeParams: params.params };
        })
      };

      await startFeathersWithService(customService, ['find', 'getVersion']);

      const { data: responseContent } = await axios.get('http://localhost:6776/service/5/version?param=abc');

      expect(responseContent).to.deep.equal({
        method: 'getVersion',
        data: {},
        queryParams: { param: 'abc' },
        routeParams: { __id: '5' }
      });
    });

    it('put method with id should be callable', async () => {
      const customService = {
        async find (params) {
          return { queryParams: params.query };
        },
        setVersion: customMethod('PUT', '/:customId/version')(async (data, params) => {
          return { method: 'setVersion', data, queryParams: params.query, routeParams: params.params };
        })
      };

      await startFeathersWithService(customService, ['find', 'setVersion']);

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

    it('patch method with id should be callable', async () => {
      const customService = {
        async find (params) {
          return { queryParams: params.query };
        },
        setVersion: customMethod('PATCH', '/:customId/version')(async (data, params) => {
          return { method: 'setVersion', data, queryParams: params.query, routeParams: params.params };
        })
      };

      await startFeathersWithService(customService, ['find', 'setVersion']);

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

    it('delete method with id should be callable', async () => {
      const customService = {
        async find (params) {
          return { queryParams: params.query };
        },
        removeVersion: customMethod('DELETE', '/:customId/version')(async (data, params) => {
          return { method: 'removeVersion', data, queryParams: params.query, routeParams: params.params };
        })
      };

      await startFeathersWithService(customService, ['find', 'removeVersion']);

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

describe('customMethodsHandler with koa', () => {
  if (isFeathers4) {
    return;
  }

  it('should fail on missing dependency', () => {
    const { customMethodsHandler } = proxyquire('../lib/custom-methods', {
      './helpers': proxyquire('../lib/helpers', { '@koa/router': null }),
    });

    const app = koaApp();
    expect(() => {
      app.configure(customMethodsHandler);
    }).to.throw(Error, 'Package @koa/router has to be installed to use the customMethodsHandler');
  });
});
