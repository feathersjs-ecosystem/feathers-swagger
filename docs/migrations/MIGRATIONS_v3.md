## Migrations for Version 3 (from 2) <!-- {docsify-ignore} -->

Version 3.0.0 introduces some breaking changes to previous 2.x.x versions. These changes and ways to migrate to the new release will be described here.

### Adjust the default schema / definition name of generated lists and pagination schemas

#### Before
Generated names were `${model}_list` and `${model}_pagination` and could not be adjusted.

#### After
Generated names will by default be `${model}List` and `${model}Pagination` but can be adjusted.

To get the old behavior you can override the schemaNames generation (on service level) or as defaults.
```js
swagger({
  specs: {
    info: {
      title: 'A test',
      description: 'A description',
      version: '1.0.0'
    },
    defaults: {
      schemaNames: {
        list: name => `${name}_list`,
        pagination: name => `${name}_pagination`,
      }
    }
  },
})
```
