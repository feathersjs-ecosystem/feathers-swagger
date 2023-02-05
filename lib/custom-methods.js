const _ = require('lodash');

const { checkImport, isExpressApp, isKoaApp, requireOrFail } = require('./helpers');

const CUSTOM_METHOD = Symbol('feathers-swagger/CUSTOM_METHOD');

let registerCustomMethod = _.identity;
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

  const CUSTOM_METHOD_HANDLER = '_feathers_swagger_custom_method_handler_';

  getCustomMethods = (app, service, defaultMethods, basePath, doc, serviceOptions) => {
    const serviceCustomMethods = [];
    const localServiceOptions = (serviceOptions || getServiceOptions(service));
    if (!localServiceOptions || !localServiceOptions.methods) {
      return serviceCustomMethods;
    }
    localServiceOptions.methods.forEach((method) => {
      if (defaultServiceMethods.includes(method)) {
        return;
      }
      const serviceMethod = service[method];
      if (typeof serviceMethod !== 'function' || doc.operations[method] === false) {
        return;
      }
      const customMethods = serviceMethod[CUSTOM_METHOD];
      if (!customMethods || !app[CUSTOM_METHOD_HANDLER]) {
        return;
      }

      customMethods.forEach(({ verb, path: uri }) => {
        // add support for id
        const httpMethod = verb.toLowerCase();
        const path = `${basePath}${uri}`;
        app[CUSTOM_METHOD_HANDLER](basePath, path, method, httpMethod);

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
    if (isExpressApp(app)) {
      const { Router } = require('express');
      const router = Router();
      app.use(router);
      app[CUSTOM_METHOD_HANDLER] = (basePath, path, method, httpMethod) => {
        router[httpMethod](path, (req, res, next) => {
          req.url = basePath;
          req.headers[http.METHOD_HEADER] = method;
          req.method = 'POST';
          req.feathers = { ...req.feathers, params: req.params };
          next();
        });
      };
    } else if (isKoaApp(app)) {
      const Router = requireOrFail('@koa/router', 'to use the customMethodsHandler');
      const router = new Router();
      app
        .use(router.routes())
        .use(router.allowedMethods());
      app[CUSTOM_METHOD_HANDLER] = (basePath, path, method, httpMethod) => {
        router[httpMethod](path, async (ctx, next) => {
          ctx.request.path = basePath;
          ctx.request.headers[http.METHOD_HEADER] = method;
          ctx.request.method = 'POST';
          ctx.feathers = { ...ctx.feathers, params: ctx.params };
          await next();
        });
      };
    }
  };
}

function customMethodDecorator (verb, path) {
  return function (target, propertyKey) {
    target[propertyKey] = customMethod(verb, path)(target[propertyKey]);
  };
}

function customMethod (verb, path) {
  return function () {
    if (arguments.length === 1) {
      return registerCustomMethod(verb, path)(arguments[0]);
    }
    return customMethodDecorator(verb, path)(...arguments);
  };
}

module.exports.registerCustomMethod = registerCustomMethod;
module.exports.customMethodDecorator = customMethodDecorator;
module.exports.getCustomMethods = getCustomMethods;
module.exports.customMethodsHandler = customMethodsHandler;
module.exports.customMethod = customMethod;
module.exports.CUSTOM_METHOD = CUSTOM_METHOD;
