const feathers = require('feathers');
const rest = require('feathers-rest');
const memory = require('feathers-memory');
const path = require('path');
const bodyParser = require('body-parser');
const swagger = require('../../lib');

const app = feathers()
  // Parse HTTP JSON bodies
  .use(bodyParser.json())
  // Parse URL-encoded params
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(rest())
  .configure(swagger({
    docsPath: '/docs',
    uiIndex: path.join(__dirname, 'docs.html'),
    info: {
      title: 'A test',
      description: 'A description'
    }
  }))
  .use('/messages', memory());

app.listen(3030);
