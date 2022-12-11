## Migrations for Version 2 (from 1) <!-- {docsify-ignore} -->

Version 2.0.0 introduces some breaking changes to previous 1.x.x versions. These changes and ways to migrate to the new release will be described here.

### Removing swagger-ui-dist dependency and the uiIndex option and replaces it by the ui option

The direct dependency to **swagger-ui-dist** was removed, so the installation and versioning is not in the hand of the library anymore.
The **uiIndex** option has been removed and is being replaced by the new **ui** option.
The **ui** option takes a function that gets 2 parameters -> (app, {docsJsonPath, specs, openApiVersion}) and should initialize the UI.
An initializer function (creator) for Swagger UI is included with feathers-swagger.

**_Hint_:** Now it is simple to use another UI for OpenAPI documentation (like [Redoc](https://github.com/Redocly/redoc) or [RapiDoc](https://github.com/rapi-doc/RapiDoc)) by using your own ui initializer function.

#### Before
```js
swagger({
  docsPath: '/docs',
  info: {
    title: 'A test',
    description: 'A description',
    version: '1.0.0'
  },
  specs: {
    info: {
      title: 'A test',
      description: 'A description',
      version: '1.0.0'
    },
    schemas: {
      // ...
    },
  },
})
```

#### After
```js
swagger({
  ui: swagger.swaggerUI({ docsPath: '/docs' }),
  specs: {
    info: {
      title: 'A test',
      description: 'A description',
      version: '1.0.0'
    },
    schemas: {
      // ...
    },
  },
})
```

### docsPath option is removed and a default value for docsJsonPath has been added

As the uiIndex has been removed and the initialization of the ui has been extracted (to the swaggerUI initializer), the docsPath option has been removed / moved to the swaggerUI initializer.
Therefore the docsJsonPath now has the default value of `/swagger.json`.

### Default of openApiVersion option was changed from 2 to 3

As the OpenApi 3 standard has more features and is the de facto standard nowadays it is now the default.

#### Before
```js
swagger({
  // no openApiVersion option
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

#### After
```js
swagger({
  openApiVersion: 2,
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
