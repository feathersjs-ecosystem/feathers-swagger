### Example with feathers generated service based on feathersjs v5 (dove) <!-- {docsify-ignore} -->

1. Go into your `src/services/{$name}` folder, and open the service you want to edit `${name}.[tj]s`
2. Import the helper function and import the schemas (example for user service):
```js  {"highlight": "11-14", "lineNumbers": true}
  import { createSwaggerServiceOptions } from 'feathers-swagger';
  import {
    userDataValidator,
    userPatchValidator,
    userQueryValidator,
    userResolver,
    userExternalResolver,
    userDataResolver,
    userPatchResolver,
    userQueryResolver,
    userSchema,
    userDataSchema,
    userPatchSchema,
    userQuerySchema
  } from './users.schema';
```
adjust the options when the service is generated
```js {"highlight": "6-12", "lineNumbers": true}
  app.use('users', new UserService(getOptions(app)), {
      // A list of all methods this service exposes externally
      methods: userMethods,
      // You can add additional custom events to be sent to clients here
      events: [],
      docs: createSwaggerServiceOptions({
          schemas: { userSchema, userDataSchema, userPatchSchema, userQuerySchema },
          docs: {
              // any options for service.docs can be added here
              securities: ['find', 'get', 'patch', 'remove'],
          }
      }),
  });
```

If you are using Typescript don't forget to add the docs property to the ServiceOptions interface
which is described on the
[Getting Started - Configure the documentation for a feathers service](/#/?id=configure-the-documentation-for-a-feathers-service)  
