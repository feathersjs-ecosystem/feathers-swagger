# feathers-swagger

[![Greenkeeper badge](https://badges.greenkeeper.io/feathersjs-ecosystem/feathers-swagger.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/feathersjs-ecosystem/feathers-swagger.png?branch=master)](https://travis-ci.org/feathersjs-ecosystem/feathers-swagger)
[![Dependency Status](https://img.shields.io/david/feathersjs-ecosystem/feathers-swagger.svg?style=flat-square)](https://david-dm.org/feathersjs-ecosystem/feathers-swagger)
[![Download Status](https://img.shields.io/npm/dm/feathers-swagger.svg?style=flat-square)](https://www.npmjs.com/package/feathers-swagger)

> Add documentation to your Featherjs services and show them in the Swagger ui.

This version is configured to work with Swagger UI 3.x

## Installation

```shell
npm install feathers-swagger --save
```

## Examples

> npm install feathers feathers-rest feathers-memory feathers-swagger body-parser

### Basic example

Here's an example of a Feathers server that uses `feathers-swagger`.

```js
const feathers = require('feathers');
const rest = require('feathers-rest');
const memory = require('feathers-memory');
const bodyParser = require('body-parser');
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

const app = feathers()

  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(rest())
  .configure(swagger({
    docsPath: '/docs',
    info: {
      title: 'A test',
      description: 'A description'
    }
  }))
  .use('/messages', messageService);

app.listen(3030);
```

Go to <http://localhost:3030/docs> to see the Swagger JSON documentation.

### Example with Feathers Generate app
1. Go into your `src/services/` folder, and open the service you want to edit `PATH.service.js`
2. Change from this:
```js
// Initialize our service with any options it requires
app.use('/events', createService(options));
```
to this:
```js
const events = createService(options)
events.docs = {
  //overwrite things here.
  //if we want to add a mongoose style $search hook to find, we can write this:
  find: {
    parameters: [
      {
        description: 'Number of results to return',
        in: 'query',
        name: '$limit',
        type: 'integer'
      },
      {
        description: 'Number of results to skip',
        in: 'query',
        name: '$skip',
        type: 'integer'
      },
      {
        description: 'Property to sort results',
        in: 'query',
        name: '$sort',
        type: 'string'
      },
      {
        description: 'Property to query results',
        in: 'query',
        name: '$search',
        type: 'string'
      }
    ]
  },
  //if we want to add the mongoose model to the 'definitions' so it is a named model in the swagger ui:
  definitions: {
    event: mongooseToJsonLibraryYouImport(Model) //import your own library, use the 'Model' object in this file.
    'event list': { //this library currently configures the return documentation to look for ``${tag} list`
         type: 'array',
         items: { $ref: '#/definitions/event' }
       }
   }
}
app.use('/events', events)
```

The overrides work at a property level - if you pass in find.parameters, that whole object will be used, it is not merged in.
you can find more information in the utils.js file to get an idea of what is passed in.


### Example with UI

The `uiIndex` option allows to set a [Swagger UI](http://swagger.io/swagger-ui/) index file which will host the UI at `docsPath`.

```js
const path = require('path');
const feathers = require('feathers');
const rest = require('feathers-rest');
const memory = require('feathers-memory');
const bodyParser = require('body-parser');
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

const app = feathers()
  .use(bodyParser.json())
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
  .use('/messages', messageService);

app.listen(3030);
```

Create a `docs.html` page like this:

```html
<!-- HTML for static distribution bundle build -->
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Swagger UI - Simple</title>
  <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,700|Source+Code+Pro:300,600|Titillium+Web:400,600,700"
    rel="stylesheet">
  <link rel="stylesheet" type="text/css" href="./swagger-ui.css">
  <link rel="icon" type="image/png" href="./favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="./favicon-16x16.png" sizes="16x16" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }

    *,
    *:before,
    *:after {
      box-sizing: inherit;
    }

    body {
      margin: 0;
      background: #fafafa;
    }

  </style>
</head>

<body>

  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="position:absolute;width:0;height:0">
    <defs>
      <symbol viewBox="0 0 20 20" id="unlocked">
        <path d="M15.8 8H14V5.6C14 2.703 12.665 1 10 1 7.334 1 6 2.703 6 5.6V6h2v-.801C8 3.754 8.797 3 10 3c1.203 0 2 .754 2 2.199V8H4c-.553 0-1 .646-1 1.199V17c0 .549.428 1.139.951 1.307l1.197.387C5.672 18.861 6.55 19 7.1 19h5.8c.549 0 1.428-.139 1.951-.307l1.196-.387c.524-.167.953-.757.953-1.306V9.199C17 8.646 16.352 8 15.8 8z"></path>
      </symbol>

      <symbol viewBox="0 0 20 20" id="locked">
        <path d="M15.8 8H14V5.6C14 2.703 12.665 1 10 1 7.334 1 6 2.703 6 5.6V8H4c-.553 0-1 .646-1 1.199V17c0 .549.428 1.139.951 1.307l1.197.387C5.672 18.861 6.55 19 7.1 19h5.8c.549 0 1.428-.139 1.951-.307l1.196-.387c.524-.167.953-.757.953-1.306V9.199C17 8.646 16.352 8 15.8 8zM12 8H8V5.199C8 3.754 8.797 3 10 3c1.203 0 2 .754 2 2.199V8z"
        />
      </symbol>

      <symbol viewBox="0 0 20 20" id="close">
        <path d="M14.348 14.849c-.469.469-1.229.469-1.697 0L10 11.819l-2.651 3.029c-.469.469-1.229.469-1.697 0-.469-.469-.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-.469-.469-.469-1.228 0-1.697.469-.469 1.228-.469 1.697 0L10 8.183l2.651-3.031c.469-.469 1.228-.469 1.697 0 .469.469.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c.469.469.469 1.229 0 1.698z"
        />
      </symbol>

      <symbol viewBox="0 0 20 20" id="large-arrow">
        <path d="M13.25 10L6.109 2.58c-.268-.27-.268-.707 0-.979.268-.27.701-.27.969 0l7.83 7.908c.268.271.268.709 0 .979l-7.83 7.908c-.268.271-.701.27-.969 0-.268-.269-.268-.707 0-.979L13.25 10z"
        />
      </symbol>

      <symbol viewBox="0 0 20 20" id="large-arrow-down">
        <path d="M17.418 6.109c.272-.268.709-.268.979 0s.271.701 0 .969l-7.908 7.83c-.27.268-.707.268-.979 0l-7.908-7.83c-.27-.268-.27-.701 0-.969.271-.268.709-.268.979 0L10 13.25l7.418-7.141z"
        />
      </symbol>


      <symbol viewBox="0 0 24 24" id="jump-to">
        <path d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7z" />
      </symbol>

      <symbol viewBox="0 0 24 24" id="expand">
        <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
      </symbol>

    </defs>
  </svg>

  <div id="swagger-ui"></div>

  <script src="./swagger-ui-bundle.js">


  </script>
  <script src="./swagger-ui-standalone-preset.js">


  </script>
  <script>
    window.onload = function () {

      // Pre load translate...
      if(window.SwaggerTranslator) {
        window.SwaggerTranslator.translate();
      }

      const url = '/docs';

      // Build a system
      const ui = SwaggerUIBundle({
        url,
        dom_id: '#swagger-ui',

        // fine tuning...
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function(swaggerApi, swaggerUi){
          if(typeof initOAuth == "function") {
            initOAuth({
              clientId: "your-client-id",
              clientSecret: "your-client-secret-if-required",
              realm: "your-realms",
              appName: "your-app-name",
              scopeSeparator: " ",
              additionalQueryStringParams: {}
            });
          }

          if(window.SwaggerTranslator) {
            window.SwaggerTranslator.translate();
          }
        },
        onFailure: function(data) {
          log("Unable to Load SwaggerUI");
        },
        docExpansion: "none",
        jsonEditor: false,
        defaultModelRendering: 'schema',
        showRequestHeaders: false,

        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      })

      window.ui = ui

      $('#input_apiKey').change(function() {
        var key = $('#input_apiKey')[0].value;
        log("key: " + key);
        if(key && key.trim() != "") {
          log("added key " + key);
          window.authorizations.add("key", new ApiKeyAuthorization("api_key", key, "query"));
        }
      })
    }
  </script>
</body>

</html>
```

Now <http://localhost:3030/docs/> will show the documentation in the browser using the Swagger UI.

You can also use `uiIndex: true` to use the default [Swagger UI](http://swagger.io/swagger-ui/).

### Prefixed routes

If your are using versioned or prefixed routes for your API like `/api/<version>/users`, you can configure it using the
`prefix` property so all your services don't end up in the same group. The value of the `prefix` property can be either
a string or a RegEx.

```js
const app = feathers()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(rest())
  .configure(swagger({
    prefix: /api\/v\d\//,
    docsPath: '/docs',
    info: {
      title: 'A test',
      description: 'A description'
    }
  }))
  .use('/api/v1/messages', messageService);

app.listen(3030);
```

To display your API version alongside the service name, you can also define a `versionPrefix` to be extracted:
```js
const app = feathers()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(rest())
  .configure(swagger({
    prefix: /api\/v\d\//,
    versionPrefix: /v\d/,
    docsPath: '/docs',
    info: {
      title: 'A test',
      description: 'A description'
    }
  }))
  .use('/api/v1/messages', messageService);

app.listen(3030);
```

## License

Copyright (c) 2016 - 2018

Licensed under the [MIT license](LICENSE).
