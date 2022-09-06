const path = require('path');

const { isKoaApp, isExpressApp, requireOrFail, versionCompare } = require('./helpers');

function generateSwaggerUIInitializerScript ({ docsJsonPath }) {
  return `
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "${docsJsonPath}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  `;
}

module.exports = function (options) {
  let swaggerUI, swaggerUIVersion;
  try {
    swaggerUI = require('swagger-ui-dist');
    swaggerUIVersion = require('swagger-ui-dist/package.json').version;
  } catch (e) {}
  if (!swaggerUI || !swaggerUIVersion || versionCompare(swaggerUIVersion, '4.9.0') === -1) {
    throw new Error('swagger-ui-dist has to be installed in a version >= 4.9.0 when using feathers-swagger.swaggerUI function');
  }

  const { docsPath = '/docs', indexFile, getSwaggerInitializerScript } = options || {};
  if (docsPath[docsPath - 1] === '/') {
    throw new Error('swaggerUi.docsPath must not contain a trailing slash');
  }

  const swaggerInitializerPath = `${docsPath}/swagger-initializer.js`;

  return function initSwaggerUI (app, swaggerConfig) {
    const { docsJsonPath, specs } = swaggerConfig;

    if (isExpressApp(app)) {
      const express = require('express');

      if (indexFile) {
        app.get(docsPath, function (req, res) {
          res.sendFile(indexFile);
        });
      }

      app.get(swaggerInitializerPath, function (req, res) {
        res.type('application/javascript');
        res.send((getSwaggerInitializerScript || generateSwaggerUIInitializerScript)({ docsPath, docsJsonPath, specs }));
      });

      app.use(docsPath, express.static(swaggerUI.getAbsoluteFSPath()));
    } else if (isKoaApp(app)) {
      const serveStatic = requireOrFail('koa-static', 'to use Swagger UI with koa');
      const koaMount = requireOrFail('koa-mount', 'to use Swagger UI with koa');

      if (indexFile) {
        const koaSend = requireOrFail('koa-send', 'to use Swagger UI with koa');
        const paths = [docsPath, `${docsPath}/`, `${docsPath}/index.html`];
        let relativeFilePath = indexFile;
        const sendOptions = {};
        if (path.isAbsolute(indexFile)) {
          relativeFilePath = path.basename(indexFile);
          sendOptions.root = path.dirname(indexFile);
        }

        app.use(async (ctx, next) => {
          if (paths.includes(ctx.url)) {
            await koaSend(ctx, relativeFilePath, sendOptions);
          } else {
            await next();
          }
        });
      }

      app.use(async (ctx, next) => {
        if (ctx.url === swaggerInitializerPath) {
          ctx.type = 'application/javascript';
          ctx.body = (getSwaggerInitializerScript || generateSwaggerUIInitializerScript)(
            { docsPath, docsJsonPath, specs }
          );
        } else {
          return next();
        }
      });

      app.use(koaMount(docsPath, serveStatic(swaggerUI.getAbsoluteFSPath())));
    }
  };
};
