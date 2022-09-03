const _ = require('lodash');
const feathers = require('@feathersjs/feathers');
const { customMethod } = require('../lib');

if (feathers.version && feathers.version[0] >= '5') {
// feathers v5

  exports.feathers = feathers.feathers;

  /**
   * Start feathers app (compatibility layer to support feathers 4 and 5)
   * @param {object} app
   * @param {number} port
   * @param {Function} [done]
   * @return {Promise<object>} server
   */
  exports.startFeathersApp = async function (app, port, done) {
    const server = await app.listen(port);
    if (done) { done(); }
    return server;
  };

  const { SERVICE } = feathers;

  /**
   * Add a custom method and emulate registration by feathers
   * @param {object} service
   * @param {object} [options]
   * @param {string} [options.name]
   * @param {string} [options.httpMethod]
   * @param {string} [options.path]
   * @param {string[]} [options.hookParams]
   */
  exports.addCustomMethod = (service, options = {}) => {
    _.defaults(options, { name: 'customMethod', httpMethod: 'POST', path: '/custom' });
    const { name, path, httpMethod } = options;

    service[name] = customMethod(httpMethod, path)(function () {});
    service[SERVICE] = { methods: [name] };
  };
} else {
  // feathers v4

  exports.feathers = feathers;

  /**
   * Start feathers app (compatibility layer to support feathers 4 and 5)
   * @param {object} app
   * @param {number} port
   * @param {Function} [done]
   * @return {Promise<object>} server
   */
  exports.startFeathersApp = function (app, port, done) {
    let server;
    return new Promise(resolve => {
      server = app.listen(port, () => resolve());
    }).then(() => {
      if (done) { done(); }
      return server;
    });
  };

  const { activateHooks } = feathers;
  const { httpMethod } = require('@feathersjs/express/rest');

  /**
   * Add a custom method and emulate registration by feathers
   * @param {object} service
   * @param {object} [options]
   * @param {string} [options.name]
   * @param {string} [options.httpMethod]
   * @param {string} [options.path]
   * @param {string[]} [options.hookParams]
   */
  exports.addCustomMethod = (service, options = {}) => {
    _.defaults(options, { name: 'customMethod', httpMethod: 'POST', path: '/custom', hookParams: ['data', 'params'] });
    const { name, hookParams, path, httpMethod: method } = options;

    service[name] = httpMethod(method, path)(activateHooks(hookParams)(function () {}));
    service.methods = Object.assign(service.methods || {}, {
      [name]: hookParams
    });
  };
}
