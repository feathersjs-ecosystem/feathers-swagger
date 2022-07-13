# feathers-swagger

[![CI](https://github.com/feathersjs-ecosystem/feathers-swagger/actions/workflows/ci.yml/badge.svg)](https://github.com/feathersjs-ecosystem/feathers-swagger/actions/workflows/ci.yml)
[![Download Status](https://img.shields.io/npm/dm/feathers-swagger.svg?style=flat-square)](https://www.npmjs.com/package/feathers-swagger)

> Add documentation to your Feathers services and optionally show them in the Swagger UI.

This version is prepared to work with Swagger UI >= 4.9

## Installation

```shell
npm install feathers-swagger swagger-ui-dist --save
```

## API

### `swagger(options)`

Initializes the module. Has to be provided to `app.configure` before the registration of services.

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
    schemes: ['http', 'https'] // Optionally set the protocol schema used (sometimes required when host on https)
  }
}));
// now you can register feathers services
app.use('/message', messageService);
```

__Options:__

- `specs` (**required**) - Global specifications that should at least contain the info section to generate a valid swagger specification
- `openApiVersion` - (*optional*, default: `3`) - OpenApi version the specification will be generated for. Allowed: 2 or 3
- `docsJsonPath` (*optional*) - The path where the swagger json will be available (independently of request Accept header).
- `ui` (*optional*) - Initializer function for the UI
- `idType` (*optional*) - The default swagger type of ids used in paths, `'integer'` will be used when not provided
- `prefix` (*optional*) - Used for automatic tag and name generation for services
- `versionPrefix` (*optional*) - Used for automatic tag and name generation for services
- `include` (*optional*) - Object to configure for which services documentation will be generated, empty means all will be included:
  - `tags` - Array of tags for that service documentation will be generated
  - `paths` - Array of paths (string or regex) for that service documentation will be generated, Notice: paths don't start with /
- `ignore` (*optional*) - Object to configure  to ignore with the following keys:
  - `tags` - Array of tags for that no service documentation will be generated
  - `paths` - Array of paths (string or regex) for that no service documentation will be generated, Notice: paths don't start with /
- `appProperty` (*optional*, default: `docs`) - Property of the feathers app object that the generated specification will be saved to, allows custom post-processing; set empty to disable
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

### `swagger.swaggerUI(options)`

Initializes the Swagger UI usage, result has to be used for the `ui` option of `swagger()` function.

__Options:__

- `docsPath` (*optional*, default: `/docs`) - Path where Swagger UI is served
- `indexFile` - (*optional*) - Path to a file which is served instead of default Swagger UI index file
- `getSwaggerInitializerScript` (*optional*) - Function to create the script that will be served as swagger-initializer.js instead of the default one from Swagger UI
  - function takes one options argument `({ docsPath, docsJsonPath, specs })` and should return a string that contains valid JS

### `service.id`

Defines the name of the id in the swagger path, by default it is `'id'`;
This can also be an array, if multiple ids are used. For example with feathers-objection or feathers-cassandra.
For services that extend adapter-commons this is set as parameter in the options when initializing the service.

### `service.docs`

If you want to customize the specifications generation for a service you can configure it by providing an options object as `docs` property of the service.

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
- `definitions`(also `schemas` for openapi v3) (*optional*) - Swagger definitions that will be merged in the global definitions
- `securities` (*optional*) - Array of operation names that are secured by global security definition, use `'all'` to enable security for all operations of the service
- `multi` (*optional*) - Array of operation names that will also be available in "multi-mode" (without id path parameter to operate on multiple resources), use `'all'` to enable it for all operations that support it
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

The overrides work at a property level - if you pass in `find.parameters`, that whole object will be used, it is not merged in.
If you want to update only parts there is [support of path keys to update specific nested structures](#path-support-to-update-nested-structures).
You can find more information in the utils.js file to get an idea of what is passed in.

### Example with UI

The `ui` option allows to set up a UI for visualizing the documentation.
Feather-swagger provides direct support for the usage of [Swagger UI](http://swagger.io/swagger-ui/) which will host the UI at `docsPath`.

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

### Prefixed routes

If you are using versioned or prefixed routes for your API like `/api/<version>/users`, you can configure it using the
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

Please note that feathers-swagger does not generate model schemas, so you might
encounter errors similar to the one below when initially using the Swagger UI.

> Could not resolve reference: Could not resolve pointer: /components/schemas/<some-model> does not exist in document

To resolve, either manually define your model schemas or consider automated alternatives like:

- [sequelize-to-json-schemas](https://github.com/alt3/sequelize-to-json-schemas)

## Migration

* [Migrations for version 1](./docs/MIGRATIONS_v1.md)
* [Migrations for version 2](./docs/MIGRATIONS_v2.md)

## License

Copyright (c) 2016 - 2022

Licensed under the [MIT license](LICENSE).
