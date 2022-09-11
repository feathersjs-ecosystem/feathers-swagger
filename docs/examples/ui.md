### Example with UI <!-- {docsify-ignore} -->

The `ui` option allows to set up a UI for visualizing the documentation.
Feather-swagger provides direct support for the usage of [Swagger UI](http://swagger.io/swagger-ui/) which will host the UI at `docsPath`.
The `sagger-ui-dist` package has to be installed manually.

```js
const path = require('path');
const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const memory = require('feathers-memory');
const swagger = require('feathers-swagger');

const messageService = memory();

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
        "useId": {
          "type": "string",
          "description": "The id of the user that send the message"
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
    ui: swagger.swaggerUI({ docsPath: '/docs' }),
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

Now <http://localhost:3030/docs/> will show the documentation in the browser using the Swagger UI.
