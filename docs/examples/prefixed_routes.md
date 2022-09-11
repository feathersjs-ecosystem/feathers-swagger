### Prefixed routes <!-- {docsify-ignore} -->

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
