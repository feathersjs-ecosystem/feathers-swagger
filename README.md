# feathers-swagger

[![Greenkeeper badge](https://badges.greenkeeper.io/feathersjs-ecosystem/feathers-swagger.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/feathersjs-ecosystem/feathers-swagger.png?branch=master)](https://travis-ci.org/feathersjs-ecosystem/feathers-swagger)
[![Dependency Status](https://img.shields.io/david/feathersjs-ecosystem/feathers-swagger.svg?style=flat-square)](https://david-dm.org/feathersjs-ecosystem/feathers-swagger)
[![Download Status](https://img.shields.io/npm/dm/feathers-swagger.svg?style=flat-square)](https://www.npmjs.com/package/feathers-swagger)

> Add documentation to your Featherjs services and show them in the Swagger UI.

This version is configured to work with Swagger UI 3.x

## Installation

```shell
npm install feathers-swagger --save
```

## API

### `swagger(options)`

Initializes the module. Should be provided to app.configure before the registration of services.

```js
const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const swagger = require('feathers-swagger');

const app = express(feathers())
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .configure(express.rest());
// ... configure app
app.configure(swagger({
  specs: {
    info: {
      title: 'A test',
      description: 'A description',
      version: '1.0.0',
    },
  }
}));
// now you can register feathers services
app.use('/message', messageService);
```

__Options:__

- `specs` (**required**) - Global specifications that should at least contain the info section to generate a valid swagger specification
- `openApiVersion` - (*optional*, default: `2`) - OpenApi version the specification will be generated for. Allowed: 2 or 3
- `docsPath` (*optional*, default: `'/docs'`) - The path where the swagger json / ui will be available.
- `docsJsonPath` (*optional*) - The path where the swagger json will be available (independently of request Accept header).
- `uiIndex` (*optional*) - Configuration of swagger ui initialization, possibilities:
  - `false` - Disable swagger ui, the json specification will be available at `docsPaths`
  - `true` - Enable default swagger ui with index from node_modules package
  - `'path/to/doc.html'` - Enable swagger ui with the provided file as index
  - `function(req, res)` - A function with customized initialization
- `idType` (*optional*) - The default swagger type of ids used in paths, `'integer'` will be used when not provided
- `prefix` (*optional*) - Used for automatic tag and name generation for services
- `versionPrefix` (*optional*) - Used for automatic tag and name generation for services
- `include` (*optional*) - Object to configure for which services documentation will be generated, empty means all will be included:
  - `tags` - Array of tags for that service documentation will be generated
  - `paths` - Array of paths (string or regex) for that service documentation will be generated, Notice: paths dont start with /
- `ignore` (*optional*) - Object to configure  to ignore with the following keys:
  - `tags` - Array of tags for that no service documentation will be generated
  - `paths` - Array of paths (string or regex) for that no service documentation will be generated, Notice: paths dont start with /
- `appProperty` (*optional*, default: `docs`) - Property of the feathers app object that the generated specification will be saved to, allows custom post processing; set empty to disable
- `defaults` (*optional*) - Object to customize the defaults for generation of the specification
  - `getOperationArgs({ service, path, config, apiPath, version })` - method to generate args that the methods for operations will consume, can also customize default tag and model generation
  - `getOperationsRefs(model, service)` - method to generate refs that the methods for operations will consume, see service.docs.refs option
  - `schemasGenerator(service, model, modelName, schemas)` - method to generate the json schemas for a service
  - `operationGenerators` - generator functions to fully customize specification generation for operations
    - `find`|`get`|`create`|`update`|`patch`|`remove` - generator function for the specific operation
    - `updateMulti`|`patchMulti`|`removeMulti` - generator function for the "multi mode" version of the specific operation
    - `custom` - generator function for all custom operations
  - `operations` - objects with defaults for the operations, with [path support to update nested structures](#path-support-to-update-nested-structures)
    - `find`|`get`|`create`|`update`|`patch`|`remove`|`nameOfCustomMethod` - to change defaults of a specific operation
    - `updateMulti`|`patchMulti`|`removeMulti` - to change defaults for "multi mode" of a specific operation
    - `all` - to change defaults of all operations
  - `multi` - array with operations that should also be available in "multi mode", use `'all'` to enable for all operations that support it

### `service.id`

Defines the name of the id in the swagger path, by default it is `'id'`;
This can also be an array, if multiple ids are used. For example with feathers-objection or feathers-cassandra.
For services that extend adapter-commons this is set as parameter in the options when initializing the service.

### `service.docs`

If you want to customize the specifications generation for a service you can configure it by providing a options object as `docs` property of the service.

```js
// service generation
messageService.docs = {
  description: 'My service description',
  definition: {
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
  }
};
```

__Options:__

- `tag` (*optional*) - Override tag that is parsed from path
- `description` (*optional*) - Provide a description for the service documentation (tag)
- `externalDocs` (*optional*) - Add external docs to service documentation (tag)
- `tags` (*optional*) - Give multiple tags
- `model` (*optional*) - Override model that is parsed from path
- `modelName` (*optional*) - Override modelName that is parsed from path
- `idType` (*optional*) - The swagger type of ids used in paths for this service. Value can be an array of types when `service.id` is set as an array.
- `idNames` (*optional*) - Object with path parameter names, to customize the idName on operation / method level
  - `get`|`update`|`patch`|`remove` - name of the path parameter for the specific method, use service.id to change it for all
- `definition`(also `schema` for openapi v3) (*optional*) - Swagger definition of the model of the service, will be merged into global definitions (with all additional generated definitions)
- `definitions`(also `schemas` for openapi v3) (*optional*) - Swagger definitions that will merged in the global definitions
- `securities` (*optional*) - Array of operation names that are secured by global security definition, use `'all'` to enable security for all operations of the service
- `multi` (*optional*) - Array of operation names that will also be available in "multi mode" (without id path parameter to operate on multiple resources), use `'all'` to enable it for all operations that support it
- `operations` (*optional*) - Object with specifications for the operations / methods of the service. [Support path keys to update specific nested structures](#path-support-to-update-nested-structures).
  - `find`|`get`|`create`|`update`|`patch`|`remove`|`nameOfCustomMethod` - Custom (parts of the) specification for the operation, can alternatively be set as doc property of the method. To disable the generation set to false.
  - `updateMulti`|`patchMulti`|`removeMulti` - if "multi mode" is enabled for the specific method, custom parts of the specification can be overwritten. To disable the generation set to false.
  - `all` - Custom (parts of the) specification for all operations.
- `refs` (*optional*) - Change the refs that are used for different operations: findResponse, getResponse, createRequest, createResponse, updateRequest, updateResponse, patchRequest, patchResponse, removeResponse, {customMethodName[Request|Response]}
- `pathParams` (*optional*) - Object with param name as key and the definition as value, should be used when using "global" path parameters
- `overwriteTagSpec` (*optional*, default: `false`) - If tag is already defined in the specs, should be overwritten from this service

### Path support to update nested structures

To be able to set only parts of a nested structure the keys of a specification object (used to define operation specifications) can be the path that should be updated.
For that the [`set`](https://lodash.com/docs/4.17.11#set) method of lodash is used with additional support to push and unshift for arrays. Also setting undefined will remove the value at the given path.
Take into account that the order of defined keys matters!

Valid push syntax:
  - `path[]`
  - `path[+]`
  - `path[+D]` with D being digits (needed to be able to define more than one element to push, the digits does not refer to a position)

Valid unshift syntax:
  - `path[-]`
  - `path[-D]` with D being digits (needed to be able to define more than one element to unshift, the digits does not refer to a position)

## Examples

*Notice:* There are more detailed examples in the example folder.

> npm install @feathersjs/feathers @feathersjs/express feathers-memory feathers-swagger

### Basic example

Here's an example of a Feathers server that uses `feathers-swagger`.

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
    docsPath: '/docs',
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
const events = createService(options);
events.docs = {
  //overwrite things here.
  //if we want to add a mongoose style $search hook to find, we can write this:
  operations: {
    find: {
      'parameters[]': {
        description: 'Property to query results',
        in: 'query',
        name: '$search',
        type: 'string'
      },
    },
  },
  //if we want to add the mongoose model to the 'definitions' so it is a named model in the swagger ui:
  definitions: {
    event: mongooseToJsonLibraryYouImport(Model), //import your own library, use the 'Model' object in this file.
    'event_list': { //this library currently configures the return documentation to look for ``${tag} list`
       type: 'array',
       items: { $ref: '#/definitions/event' }
     }
   }
};
app.use('/events', events);
```

The overrides work at a property level - if you pass in find.parameters, that whole object will be used, it is not merged in.
If you want to update only parts there is [support of path keys to update specific nested structures](#path-support-to-update-nested-structures).
You can find more information in the utils.js file to get an idea of what is passed in.

### Example with UI

The `uiIndex` option allows to set a [Swagger UI](http://swagger.io/swagger-ui/) index file which will host the UI at `docsPath`.

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
    docsPath: '/docs',
    uiIndex: path.join(__dirname, 'docs.html'),
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
      });

      window.ui = ui;

      $('#input_apiKey').change(function() {
        var key = $('#input_apiKey')[0].value;
        log("key: " + key);
        if(key && key.trim() !== "") {
          log("added key " + key);
          window.authorizations.add("key", new ApiKeyAuthorization("api_key", key, "query"));
        }
      });
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
const app = express(feathers())
  // ... configure app
  .configure(swagger({
    prefix: /api\/v\d\//,
    docsPath: '/docs',
    specs: {
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0',
      },
    },
  }))
  .use('/api/v1/messages', messageService);

app.listen(3030);
```

To display your API version alongside the service name, you can also define a `versionPrefix` to be extracted:
```js
const app = express(feathers())
  // ... configure app
  .configure(swagger({
    prefix: /api\/v\d\//,
    versionPrefix: /v\d/,
    docsPath: '/docs',
    specs: {
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0',
      },
    },
  }))
  .use('/api/v1/messages', messageService);

app.listen(3030);
```

## Model Schemas

Please note that feathers-swagger does not generate model schemas so you might
encounter errors similar to the one below when initially using the Swagger UI.

> Could not resolve reference: Could not resolve pointer: /components/schemas/<some-model> does not exist in document

To resolve, either manually define your model schemas or consider automated alternatives like:

- [sequelize-to-json-schemas](https://github.com/alt3/sequelize-to-json-schemas)

## Migration

Version 1.0.0 introduces some breaking changes to previous 0.7.x versions. These changes and ways to migrate to the new release will be described here.

### Introduction of specs option

To not mix up options and specification as before all specifications go into the new specs option.

#### Before
```js
swagger({
  prefix: /api\/v\d\//,
  versionPrefix: /v\d/,
  docsPath: '/docs',
  info: {
    title: 'A test',
    description: 'A description',
    version: '1.0.0'
  },
  definitions: {
    // ...
  },
})
```

#### After
```js
swagger({
  prefix: /api\/v\d\//,
  versionPrefix: /v\d/,
  docsPath: '/docs',
  specs: {
    info: {
      title: 'A test',
      description: 'A description',
      version: '1.0.0'
    },
    definitions: {
      // ...
    },
  },
})

```
### Introduction of operations option of the service.doc config

With introduction of custom methods support it made more sense (also because of TypeScript) to nest operations specifications.

#### Before
```js
messageService.docs = {
  find: {
    description: 'My description',
  },
};
```

#### After
```js
messageService.docs = {
  operations: {
    find: {
      description: 'My description',
    },
  },
};
```

### Remove of findQueryParameters option

This option was very specific to add (prepend) parameters to all find operations.
With the introduced option to customize defaults you can also add more default find parameters.

#### Before
```js
swagger({
  // ...
  findQueryParameters: [
    {
      description: 'My custom query parameter',
      in: 'query',
      name: '$custom',
      type: 'string'
    },
  ],
})
```

#### After
```js
swagger({
  // ...
  defaults: {
    operations: {
      find: {
        'parameters[-]': {
          description: 'My custom query parameter',
          in: 'query',
          name: '$custom',
          type: 'string'
        }
      }
    }
  }
})
```

### Generate RFC3986-compliant percent-encoded URIs

To generate valid specifications there may not be spaces in $ref links.
Therefor concatenation is done with _ by default now. This applies to list and version refs of the previous version.

#### Before
```js
messageService.docs = {
  definitions: {
    message: { /* definition */ },
    'message list': {
      type: 'array',
      items: { $ref: '#/definitions/message' }
    }
  }
};
// Versioned service
messageV1Service.docs = {
  definitions: {
    'message v1': { /* definition */ },
    'message v1 list': {
      type: 'array',
      items: { $ref: '#/definitions/message v1' }
    }
  }
};
```

#### After
```js
messageService.docs = {
  definitions: {
    message: { /* definition */ },
    message_list: {
      type: 'array',
      items: { $ref: '#/definitions/message' }
    }
  }
};
// Versioned service
messageV1Service.docs = {
  definitions: {
    message_v1: { /* definition */ },
    message_v1_list: {
      type: 'array',
      items: { $ref: '#/definitions/message_v1' }
    }
  }
};
```

### Removal of sequelize related utils

Because sequelize is not in the scope of this package the utils getType, getFormat, property and definition were removed.
If you used them extract them from an old version or use other packages which provide this functionality.

#### Before
```js
const { definition } = 'feathers-swagger';

messageService.docs = {
  definition: definition(Model),
};
```

#### After
```js
const sequelizeJsonSchema = require('sequelize-json-schema');

messageService.docs = {
  definition: sequelizeJsonSchema(Model),
};
```

### Overwriting of already defined tags specifications is now opt-in

Introduced with [PR: Fix: docs ignored when path already exists \#69](https://github.com/feathersjs-ecosystem/feathers-swagger/pull/69)
the last registered service will always overwrite previously defined tags. To be able to handle it by config
the `overwriteTagSpec` was introduced. It defaults to false, which is a breaking change.

#### Before
```js
  // ...
  app.use('/projects/:projectId/sync', projectsSyncService);
  // use tag from second service
  const docs = { description: 'My Project Service' };
  app.use('/projects', Object.assign(service(options), { docs }) );
```

#### After
```js
  // ...
  app.use('/projects/:projectId/sync', projectsSyncService);
  // use tag from second service
  const docs = { description: 'My Project Service', overwriteTagSpec: true };
  app.use('/projects', Object.assign(service(options), { docs }) );
```

## License

Copyright (c) 2016 - 2019

Licensed under the [MIT license](LICENSE).
