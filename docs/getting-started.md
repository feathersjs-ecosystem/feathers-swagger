# feathers-swagger

[![CI](https://github.com/feathersjs-ecosystem/feathers-swagger/actions/workflows/ci.yaml/badge.svg)](https://github.com/feathersjs-ecosystem/feathers-swagger/actions/workflows/ci.yaml)
[![Download Status](https://img.shields.io/npm/dm/feathers-swagger.svg?style=flat-square)](https://www.npmjs.com/package/feathers-swagger)

Add [OpenAPI](https://swagger.io/resources/open-api/) documentation to your Feathers services and optionally show them in the [Swagger UI](https://swagger.io/tools/swagger-ui/).

You can also add custom methods to feathers services that will be available as rest routes but not via the feathers client. 

This version is prepared to work with Swagger UI >= 4.9

## Installation

<!-- tabs:start -->

#### **Default (express)**

```shell
npm install feathers-swagger swagger-ui-dist
```

#### **Koa**

```shell
npm install feathers-swagger swagger-ui-dist koa-mount koa-static
```

#### **Koa with custom methods**

```shell
npm install feathers-swagger swagger-ui-dist @koa/router koa-mount koa-static
```

#### **Minimum**

```shell
npm install feathers-swagger
```

<!-- tabs:end -->

## Usage

### Initialize feathers swagger

It has to initialized before the services are registered.
Only for services registered after feather-swagger documentation will be generated.
There are many options, please check out the [API documentation](api.md#swaggeroptions) to get more details.

<!-- tabs:start -->

#### **Simple**

```js
// ... imports
const swagger = require('feathers-swagger');

const app = express(feathers())
  // ...
  .configure(swagger({
    specs: {
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0',
      },
    },
  }))
  // later services can be registered
```

#### **With SwaggerUI**

To enable the usage of SwaggerUI the `ui` option has to be set with the result of `swagger.swaggerUI()`. Checkout the [available options](api.md#swaggerswaggeruioptions) for `swaggerUI`. 

```js
// ... imports
const swagger = require('feathers-swagger');

const app = express(feathers())
  // ...
  .configure(swagger({
    specs: {
      ui: swagger.swaggerUI(),
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0',
      },
    },
  }))
  // later services can be registered
```

#### **Custom Methods support with feathers 5**

To support the usage of custom methods in feathers 5 the `customMethodsHandler` middleware has to be registered before the rest middleware of express or koa.

```js
// ... imports
const swagger = require('feathers-swagger');

const app = express(feathers())
  // ...
  .configure(swagger.customMethodsHandler)
  .configure(express.rest()) // or rest() of koa
  .configure(swagger({
    specs: {
      info: {
        title: 'A test',
        description: 'A description',
        version: '1.0.0',
      },
    },
  }))
  // later services can be registered
```

<!-- tabs:end -->

### Configure the documentation for a feathers service

To customize the documentation of feathers service a docs property has to be added. This can be done as property before the service is registered or as service path option.
There are many options please check out the [examples](examples/index.md) and the [API documentation](api.md#servicedocs) to get more details.

<!-- tabs:start -->

#### **Service path option (TS)**
The docs property can be set as [path service options](https://dove.feathersjs.com/api/application.html#use-path-service-options) introduced with feathers dove. 

```typescript
import type { createSwaggerServiceOptions } from 'feathers-swagger';
import {
  messageDataSchema,
  messageQuerySchema,
  messageSchema,
} from './message.schema';

// ...

app.use('message', new MessageService(), {
  methods: ['find', 'get', 'create', 'update', 'patch', 'remove'],
  events: [],
  docs: createSwaggerServiceOptions({
    schemas: { messageDataSchema, messageQuerySchema, messageSchema },
    docs: { description: 'My custom service description' }
  })
});
```

To be able to set the docs property on the service options, the interface has to be adjusted in the `declarations.ts` of the project.

```typescript
import { ServiceSwaggerOptions } from 'feathers-swagger';

// ...

declare module '@feathersjs/feathers' {
  interface ServiceOptions {
    docs?: ServiceSwaggerOptions;
  }
}
```

#### **Simple**
The docs property can be set as property of a service instance before it is registered.


```js
// definition of service
service.docs = {
  description: 'A description for the service',
  schema: { /* definition of the openapi schema for the service */ }
};
app.use('pathForService', service); // service is registered after docs property has been set
```

#### **Class Property (TS)**
The docs property can also be directly set as property of a service class that later is registered.

```typescript
import type { ServiceSwaggerOptions } from 'feathers-swagger';

// ...

class SomeService extends AnyAdapter {
  docs: ServiceSwaggerOptions = {
    description: 'Description of the service'
    // ...
  };
}
```

<!-- tabs:end -->

## Model Schemas

Please note that feathers-swagger does not generate model schemas, so you might
encounter errors similar to the one below when initially using the Swagger UI.

> Could not resolve reference: Could not resolve pointer: /components/schemas/<some-model> does not exist in document

To resolve, either manually define your model schemas or consider automated alternatives like:

- [sequelize-to-json-schemas](https://github.com/alt3/sequelize-to-json-schemas)

## Migration

* [Migrations for version 1](migrations/MIGRATIONS_v1.md)
* [Migrations for version 2](migrations/MIGRATIONS_v2.md)
* [Migrations for version 3](migrations/MIGRATIONS_v3.md)

## License

Copyright (c) 2016 - 2022

Licensed under the [MIT license](LICENSE).
