### Example with feathers generated app <!-- {docsify-ignore} -->

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
If you want to update only parts there is [support of path keys to update specific nested structures](/api.md#path-support-to-update-nested-structures).
You can find more information in the utils.js file to get an idea of what is passed in.
