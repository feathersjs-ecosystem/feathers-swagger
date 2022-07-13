const express = require('express');

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
  if (!swaggerUI || !swaggerUIVersion ||
    (swaggerUIVersion.localeCompare('4.9.0', undefined, { numeric: true, sensitivity: 'base' }) === -1)
  ) {
    throw new Error('swagger-ui-dist has to be installed in a version >= 4.9.0 when using feathers-swagger.swaggerUI function');
  }

  const { docsPath = '/docs', indexFile, getSwaggerInitializerScript } = options || {};

  const swaggerInitializerPath = `${docsPath}/swagger-initializer.js`;

  return function initSwaggerUI (app, swaggerConfig) {
    const { docsJsonPath, specs } = swaggerConfig;

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
  };
};
