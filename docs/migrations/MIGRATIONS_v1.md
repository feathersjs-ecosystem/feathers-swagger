## Migrations for Version 1 <!-- {docsify-ignore} -->

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
Therefore concatenation is done with _ by default now. This applies to list and version refs of the previous version.

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
