## API <!-- {docsify-ignore} -->

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
  - `getOperationArgs({ service, path, config, apiPath, version })` - Function to generate args that the methods for operations will consume, can also customize default tag and model generation
  - `getOperationsRefs(model, service)` - Function to generate refs that the methods for operations will consume, see service.docs.refs option
  - `schemasGenerator(service, model, modelName, schemas)` - Function to generate the json schemas for a service
  - `schemaNames`
    - `list(model)` - function to return the default name for the list schema, defaults to `${model}List` if not provided
    - `pagination(model)` - function to return the default name for the list schema, defaults to `${model}Pagination` if not provided 
  - `operationGenerators` - Generator functions to fully customize specification generation for operations. To disable the generation of a method return false.
    - `find`|`get`|`create`|`update`|`patch`|`remove` - Generator function for the specific operation.
    - `updateMulti`|`patchMulti`|`removeMulti` - Generator function for the "multi mode" version of the specific operation
    - `custom` - Generator function for all custom operations
  - `operations` - Objects with defaults for the operations, with [path support to update nested structures](#path-support-to-update-nested-structures)
    - `find`|`get`|`create`|`update`|`patch`|`remove`|`nameOfCustomMethod` - to change defaults of a specific operation. To disable the generation set to false.
    - `updateMulti`|`patchMulti`|`removeMulti` - to change defaults for "multi mode" of a specific operation. To disable the generation set to false.
    - `all` - to change defaults of all operations
  - `multi` - Array with operations that should also be available in "multi mode", use `'all'` to enable for all operations that support it

### `swagger.swaggerUI(options)`

Initializes the Swagger UI usage, result has to be used for the `ui` option of `swagger()` function.

__Options:__

- `docsPath` (*optional*, default: `/docs`) - Path where Swagger UI is served
- `indexFile` - (*optional*) - Path to a file which is served instead of default Swagger UI index file
- `getSwaggerInitializerScript({ docsPath, docsJsonPath, specs })` (*optional*) - Function to create the script that will be served as swagger-initializer.js instead of the default one from Swagger UI
  - The function takes one options object and should return a string that contains valid JS

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
- `refs` (*optional*) - Object with mapping of refs that are used for different operations, by setting the schema name
  - `findResponse`
  - `getResponse`
  - `createRequest`
  - `createResponse`
  - `createMultiRequest` - only with `openApiVersion` 3
  - `createMultiResponse` - only with `openApiVersion` 3
  - `updateRequest`
  - `updateResponse`
  - `updateMultiRequest`
  - `updateMultiResponse`
  - `patchRequest`
  - `patchResponse`
  - `patchMultiRequest`
  - `patchMultiResponse`
  - `removeResponse`
  - `removeMultiResponse`
  - `filterParameter`
  - `sortParameter`
  - `queryParameters` - only with `openApiVersion` 3
  - `{customMethodName[Request|Response]}`
- `schemaNames` (*optional*) - Adjust the automatic generation of schema names
  - `list(model)` - Function to return the name for the list schema, defaults to `${model}List` if not provided
  - `pagination(model)` - Function to return the name for the list schema, defaults to `${model}Pagination` if not provided
- `pathParams` (*optional*) - Object with param name as key and the definition as value, should be used when using "global" path parameters
- `overwriteTagSpec` (*optional*, default: `false`) - If tag is already defined in the specs, should be overwritten from this service

### `swagger.createSwaggerServiceOptions(options)`

Helper function to create a `service.docs` object, based on the provided schemas.
Only the `schemas`, `refs` and `model` properties will be generated.

__Options:__
- `schemas` - Object with TypeBox or json schemas
  - Provide the generated schemas with `xxxSchema`, `xxxDataSchema` and `xxxQuerySchema` naming schema
    - This will generate the `schemas` and `refs` and `model` based on the provided schemas
  - Provide any schema that has an `$id` with any name
    - This will just add the schema that can be consumed in refs or customized operations specifications
  - Provide any schema that has an `$id` with a ref as key, check `service.docs.refs` for allowed refs
    - This will add the schema and use it for the given ref
- `docs` - Any service.docs options that will be merged into the resulting object and would overwrite anything that will be generated
- `sanitizeSchema` - A function that sanitizes the schema from properties that are not allowed in an OpenApi specification.
   If not provided a default implementation will be used. 

### Path support to update nested structures

To be able to set only parts of a nested structure the keys of a specification object (used to define operation specifications) can be the path that should be updated.
For that the [`set`](https://lodash.com/docs/4.17.15#set) method of lodash is used with additional support to push and unshift for arrays. Also setting undefined will remove the value at the given path.
Take into account that the order of defined keys matters!

Valid push syntax:
- `path[]`
- `path[+]`
- `path[+D]` with D being digits (needed to be able to define more than one element to push, the digits does not refer to a position)

Valid unshift syntax:
- `path[-]`
- `path[-D]` with D being digits (needed to be able to define more than one element to unshift, the digits does not refer to a position)

### `swagger.customMethod(verb, path)`

To define the rest method of a custom method it has to be wrapped/annotated with `customMethod`.
For Feathers 5 the custom method has to be added to the methods when registering the service.
The `customMethodsHandler` has to be registered before the initialization -> [Usage](/#initialize-feathers-swagger).

<!-- tabs:start -->

#### **Javascript**

```js
const { customMethod } = require('feathers-swagger');

const someService = {
  custom: customMethod('POST', '/custom')(async (data, params) => {
    return { data, queryParams: params.query, routeParams: params.route };
  }),
};
```

#### **Typescript with decorators**

```typescript
import { customMethod } from 'feathers-swagger';

class SomeService {
  @customMethod('POST', '/custom')
  async custom(data: any, params: Params) {
    return { data, queryParams: params.query, routeParams: params.route };
  }
}
```

<!-- tabs:end -->

__arguments__:

- `verb` the http method the custom method should use
- `path` the path of the custom method, can contain placeholders in the form of `/path/:placeholder`
