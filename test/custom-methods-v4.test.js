const express = require('@feathersjs/express');
const axios = require('axios').default;
const { expect } = require('chai');

const { feathers, startFeathersApp, isFeathers4 } = require('./helper');
const { customMethod } = require('../lib');

describe('feathers 4 custom http methods', () => {
  if (!isFeathers4) {
    return; // only valid with feathers 4
  }

  let server;

  const startFeathersWithService = (service) => {
    const app = express(feathers())
      .use(express.json())
      .use(express.urlencoded({
        extended: true
      }))
      .configure(express.rest())
      .use('/service', service);

    return startFeathersApp(app, 6776).then((res) => { server = res; });
  };

  afterEach(done => server.close(done));

  it('handle simple post method', async () => {
    const customService = {
      async find (params) {
        return { queryParams: params.query };
      },
      getVersion: customMethod('POST', '/getVersion')(async (data, params) => {
        return { method: 'getVersion', data, queryParams: params.query, routeParams: params.route };
      })
    };

    await startFeathersWithService(customService);

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

  it('handle get method with id', async () => {
    const customService = {
      async find (params) {
        return { queryParams: params.query };
      },
      getVersion: customMethod('GET', '/:customId/version')(async (data, params) => {
        return { method: 'getVersion', data, queryParams: params.query, routeParams: params.route };
      })
    };

    await startFeathersWithService(customService);

    const { data: responseContent } = await axios.get('http://localhost:6776/service/5/version?param=abc');

    expect(responseContent).to.deep.equal({
      method: 'getVersion',
      data: {},
      queryParams: { param: 'abc' },
      routeParams: { customId: '5' }
    });
  });

  it('handle get method with feathers id', async () => {
    const customService = {
      async find (params) {
        return { queryParams: params.query };
      },
      getVersion: customMethod('GET', '/:__feathersId/version')(async (data, params, id) => {
        return { method: 'getVersion', data, id, queryParams: params.query, routeParams: params.route };
      })
    };

    await startFeathersWithService(customService);

    const { data: responseContent } = await axios.get('http://localhost:6776/service/5/version?param=abc');

    expect(responseContent).to.deep.equal({
      method: 'getVersion',
      data: {},
      id: '5',
      queryParams: { param: 'abc' },
      routeParams: {}
    });
  });

  it('handle put method with id', async () => {
    const customService = {
      async find (params) {
        return { queryParams: params.query };
      },
      setVersion: customMethod('PUT', '/:customId/version')(async (data, params) => {
        return { method: 'setVersion', data, queryParams: params.query, routeParams: params.route };
      })
    };

    await startFeathersWithService(customService);

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

  it('handle patch method with id', async () => {
    const customService = {
      async find (params) {
        return { queryParams: params.query };
      },
      setVersion: customMethod('PATCH', '/:customId/version')(async (data, params) => {
        return { method: 'setVersion', data, queryParams: params.query, routeParams: params.route };
      })
    };

    await startFeathersWithService(customService);

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

  it('handle delete method with id', async () => {
    const customService = {
      async find (params) {
        return { queryParams: params.query };
      },
      removeVersion: customMethod('DELETE', '/:customId/version')(async (data, params) => {
        return { method: 'removeVersion', data, queryParams: params.query, routeParams: params.route };
      })
    };

    await startFeathersWithService(customService);

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
