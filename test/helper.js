const _ = require('lodash');
const { activateHooks } = require('@feathersjs/feathers');
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
