const path = require('path');
const url = require('url');
const serveStatic = require('serve-static');
const OpenApiGenerator = require('./openapi');
const utils = require('./utils');

const init = module.exports = function (config) {
  return function () {
    const app = this;

    const specs = {};
    app.docs = specs;

    const { docsPath = '/docs', uiIndex } = config;

    let modulesRootPath;
    if (uiIndex === true) {
      // Find node_modules root path
      modulesRootPath = require.resolve('swagger-ui-dist');
      modulesRootPath = modulesRootPath.substr(0, modulesRootPath.lastIndexOf('node_modules'));
    }

    // Create API for Documentation
    app.get(docsPath, function (req, res) {
      res.format({
        'application/json': function () {
          res.json(specs);
        },

        'text/html': function () {
          const parsed = url.parse(req.url);
          const pathname = parsed.pathname;

          if (pathname[pathname.length - 1] !== '/') {
            parsed.pathname = `${req.baseUrl}${pathname}/`;
            return res.redirect(301, url.format(parsed));
          }

          if (typeof uiIndex === 'function') {
            uiIndex(req, res);
          } else if (typeof uiIndex === 'string') {
            res.sendFile(uiIndex);
          } else if (uiIndex === true) {
            if (req.query.url) {
              res.sendFile(path.join(modulesRootPath, 'node_modules/swagger-ui-dist/index.html'));
            } else {
              // Set swagger url (needed for default UI)
              res.redirect(`?url=${encodeURI(docsPath)}`);
            }
          } else {
            res.json(specs);
          }
        }
      });
    });

    if (typeof uiIndex !== 'undefined') {
      const uiPath = path.dirname(require.resolve('swagger-ui-dist'));
      app.use(docsPath, serveStatic(uiPath));
    }

    const specGenerator = new OpenApiGenerator(app, specs, config);

    // Optional: Register this plugin as a Feathers provider
    if (app.version && parseInt(app.version, 10) >= 3) {
      app.mixins.push(specGenerator.addService);
    } else {
      app.providers.push((path, service) => specGenerator.addService(service, path));
    }
  };
};

Object.assign(init, utils);
