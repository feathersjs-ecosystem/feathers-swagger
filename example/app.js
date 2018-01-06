const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const memory = require('feathers-memory');
const path = require('path');
const swagger = require('../lib');
const messageService = memory();

messageService.docs = {
  description: 'A service to send and receive messages',
  definitions: {
    messages: {
      type: 'object',
      required: [
        'text'
      ],
      properties: {
        text: {
          type: 'string',
          description: 'The message text'
        },
        userId: {
          type: 'string',
          description: 'The id of the user that send the message'
        }
      }
    },
    'messages list': {
      type: 'array'
    }
  }
};

const serveStatic = require('serve-static');
const distPath = require.resolve('swagger-ui-dist');

// alternatively point to local file:
// const uiIndex = path.join(__dirname, 'docs.html')
const uiIndex = path.join(__dirname, 'docs.html');

const app = express(feathers())
  .use(express.json())
  .use(express.urlencoded({
    extended: true
  }))
  .use(serveStatic(distPath))
  .configure(express.rest())

  .configure(swagger({
    docsPath: '/docs',
    uiIndex,
    info: {
      title: 'A test',
      description: 'A description',
      version: '1.0.0'
    }
  }))
  .use('/messages', messageService);

console.log('Simple feathers-swagger example running on http://localhost:3030/docs/');

app.listen(3030);
