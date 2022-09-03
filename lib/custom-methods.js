const _ = require('lodash');

function checkImport (packageName, child) {
  try {
    const rest = require(packageName);
    /* __istanbul ignore else: for @feathers/express versions < 4 */
    if (rest[child]) {
      return true;
    }
  } catch (e) {}
  /* __istanbul ignore next: for @feathers/express versions < 4 */
  return false;
}

const CUSTOM_METHOD = Symbol('feathers-swagger/CUSTOM_METHOD');

let registerCustomMethod = _.noop;
let getCustomMethods = () => [];
let customMethodsHandler = _.noop;

if (checkImport('@feathersjs/express/rest', 'HTTP_METHOD')) {
  const { activateHooks } = require('@feathersjs/feathers');
  const { HTTP_METHOD, httpMethod } = require('@feathersjs/express/rest');

  getCustomMethods = (app, service, defaultMethods, basePath, doc) => {
    const customMethods = [];
    if (!service.methods) {
      return customMethods;
    }
    Object.keys(_.omit(service.methods, Object.keys(defaultMethods))).forEach((method) => {
      const serviceMethod = service[method];
      if (typeof serviceMethod !== 'function' || doc.operations[method] === false) {
        return;
      }
      const httpMethod = serviceMethod[HTTP_METHOD];
      if (!httpMethod) {
        return;
      }
      httpMethod.forEach(({ verb, uri }) => {
        // add support for id
        const path = `${basePath}${uri}`;
        customMethods.push({ path, method, httpMethod: verb.toLowerCase() });
      });
    });
    return customMethods;
  };

  registerCustomMethod = (verb, path) => {
    const hooksParams = ['data', 'params'];
    if (path.includes(':__feathersId')) {
      hooksParams.push('id');
    }
    return function (method) {
      return httpMethod(verb, path)(activateHooks(hooksParams)(method));
    };
  };
} else if (checkImport('@feathersjs/feathers', 'getServiceOptions')) {
  const { getServiceOptions, defaultServiceMethods } = require('@feathersjs/feathers');
  const { http } = require('@feathersjs/transport-commons');
  const { Router } = require('express');
  const ROUTER_CONFIG_NAME = '_feathers_swagger_custom_method_router_';

  getCustomMethods = (app, service, defaultMethods, basePath, doc) => {
    const serviceCustomMethods = [];
    const serviceOptions = getServiceOptions(service);
    serviceOptions.methods.forEach((method) => {
      if (defaultServiceMethods.includes(method)) {
        return;
      }
      const serviceMethod = service[method];
      if (typeof serviceMethod !== 'function' || doc.operations[method] === false) {
        return;
      }
      const customMethods = serviceMethod[CUSTOM_METHOD];
      if (!customMethods) {
        return;
      }
      const router = app.get(ROUTER_CONFIG_NAME);
      customMethods.forEach(({ verb, path: uri }) => {
        // add support for id
        const httpMethod = verb.toLowerCase();
        const path = `${basePath}${uri}`;
        if (router) {
          // Redirect to feathers custom service method
          router[httpMethod](path, (req, res, next) => {
            req.url = basePath;
            req.headers[http.METHOD_HEADER] = method;
            req.method = 'POST';
            req.feathers = { ...req.feathers, params: req.params };
            next();
          });
        }
        serviceCustomMethods.push({ path, method, httpMethod });
      });
    });
    return serviceCustomMethods;
  };

  registerCustomMethod = (verb, path) => {
    return function (method) {
      if (!method[CUSTOM_METHOD]) {
        method[CUSTOM_METHOD] = [];
      }
      method[CUSTOM_METHOD].push({ verb, path });
      return method;
    };
  };

  customMethodsHandler = (app) => {
    const router = Router();
    app.use(router);
    app.set(ROUTER_CONFIG_NAME, router);
  };
}

module.exports.registerCustomMethod = registerCustomMethod;
module.exports.getCustomMethods = getCustomMethods;
module.exports.customMethodsHandler = customMethodsHandler;
