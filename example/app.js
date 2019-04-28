const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const path = require('path');

const serveStatic = require('serve-static');
const distPath = require.resolve('swagger-ui-dist');

const swaggerV2Definitions = require('./swagger-v2/definitions');
const swaggerV2DefinitionWithCustomizedSpec = require('./swagger-v2/definitionWithCustomizedSpec');
const swaggerV2customTags = require('./swagger-v2/customTags');

const app = express(feathers())
  .use(express.json())
  .use(express.urlencoded({
    extended: true
  }))
  .use(serveStatic(distPath))
  .configure(express.rest())

  .get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  })

  .configure(swaggerV2Definitions)
  .configure(swaggerV2DefinitionWithCustomizedSpec)
  .configure(swaggerV2customTags)

  ;

console.log('Simple app with multiple feathers-swagger examples running on http://localhost:3030/');

app.listen(3030);
