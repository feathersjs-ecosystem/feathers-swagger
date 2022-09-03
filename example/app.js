const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const path = require('path');
const swagger = require('../lib');

const serveStatic = require('serve-static');
const distPath = require.resolve('swagger-ui-dist');

const swaggerV2Definitions = require('./swagger-v2/definitions');
const swaggerV2DefinitionWithCustomizedSpec = require('./swagger-v2/definitionWithCustomizedSpec');
const swaggerV2CustomTags = require('./swagger-v2/customTags');
const swaggerV2Security = require('./swagger-v2/security');
const swaggerV2CustomMethods = require('./swagger-v2/customMethods');
const openApiV2Multi = require('./swagger-v2/multi');

const openApiV3Definitions = require('./openapi-v3/definitions');
const openApiV3DefinitionWithCustomizedSpec = require('./openapi-v3/definitionWithCustomizedSpec');
const openApiV3CustomTags = require('./openapi-v3/customTags');
const openApiV3Security = require('./openapi-v3/security');
const openApiV3CustomMethods = require('./openapi-v3/customMethods');
const openApiV3Multi = require('./openapi-v3/multi');
const openApiV3IdNames = require('./openapi-v3/idNames');

const app = express(feathers())
  .use(express.json())
  .use(express.urlencoded({
    extended: true
  }))
  .use(serveStatic(distPath))
  .configure(swagger.customMethodsHandler)
  .configure(express.rest())

  .get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  })
  .get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs.html'));
  })
  .use(serveStatic(path.dirname(require.resolve('swagger-ui-dist'))))

  .configure(swaggerV2Definitions)
  .configure(swaggerV2DefinitionWithCustomizedSpec)
  .configure(swaggerV2CustomTags)
  .configure(swaggerV2Security)
  .configure(swaggerV2CustomMethods)
  .configure(openApiV2Multi)

  .configure(openApiV3Definitions)
  .configure(openApiV3DefinitionWithCustomizedSpec)
  .configure(openApiV3CustomTags)
  .configure(openApiV3Security)
  .configure(openApiV3CustomMethods)
  .configure(openApiV3Multi)
  .configure(openApiV3IdNames)

  ;

console.log('Simple app with multiple feathers-swagger examples running on http://localhost:3030/');

app.listen(process.env.PORT || 3030);
