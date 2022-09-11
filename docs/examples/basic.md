### Basic example <!-- {docsify-ignore} -->

Here's an example of a Feathers server that uses `feathers-swagger`.

> npm install @feathersjs/feathers @feathersjs/express feathers-memory feathers-swagger

```js
const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const memory = require('feathers-memory');
const swagger = require('feathers-swagger');

const messageService = memory();

// swagger spec for this service, see http://swagger.io/specification/
messageService.docs = {
  description: 'A service to send and receive messages',
  definitions: {
    messages: {
      "type": "object",
      "required": [
        "text"
      ],
      "properties": {
        "text": {
          "type": "string",
          "description": "The message text"
        },
        "userId": {
          "type": "string",
          "description": "The id of the user that sent the message"
        }
      }
    }
  }
};

const app = express(feathers())
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .configure(express.rest())
  .configure(swagger({
    specs: {
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0',
      },
    },
  }))
  .use('/messages', messageService);

app.listen(3030);
```

Visit <http://localhost:3030/swagger.json> to see the Swagger JSON documentation.
