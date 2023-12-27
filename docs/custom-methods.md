# Custom Methods  <!-- {docsify-ignore} -->

## Introduction

If you want to define non-CRUD action there are some possibilities. The [feathers documentation](https://docs.feathersjs.com/help/faq.html#how-do-i-create-custom-methods) proposes the usage of hooks or custom service.

In feathers 4 custom (express) methods were introduced but never documented. There is also the drawback that they are registered after the default methods, so a /service/{id} will always win over a custom /service/custom (only POST has no /{id} route and can be used without restrictions).

Feathers 5 replaced the custom methods implementation and now custom methods are also supported via websockets and feathers-client. Here the drawback is, that the custom methods for http transports are only kind of second class citizen by utilizing headers. They cannot be documented with OpenAPI in a good way.

If you want to have custom RPC style actions, that can be documented via OpenAPI you can use the custom method "wrapper" that feathers-swagger provides.

## Requirements

To use custom methods with feathers 5 the `customMethodHandler` has to be registered, before rest services. For koa the `@koa/router` has to be installed.

See [Usage](/#installation) for detailed information.

## Usage

### Feathers 4

For feathers 4 it is enough to wrap / annotate the custom method

<!-- tabs:start -->

#### **Javascript object**

```js
const { customMethod } = require('feathers-swagger');

const someService = {
  async find() {},
  custom: customMethod('POST', '/some/custom')(async (data, params) => {
    return { data, queryParams: params.query, routeParams: params.route };
  }),
};
```

#### **Typescript with decorators**

```typescript
import { customMethod } from 'feathers-swagger';

class SomeService {
  async find() {}

  @customMethod('POST', '/some/custom')
  async custom(data: any, params: Params) {
    return { data, queryParams: params.query, routeParams: params.route };
  }
}
```

<!-- tabs:end -->

### Feathers 5

For feathers 5 in addition to the wrapping / annotation of the custom method
you have to define the custom method when registering the service.

<!-- tabs:start -->

#### **Javascript object**

```js
const { customMethod } = require('feathers-swagger');

const someService = {
  async find() {},
  custom: customMethod('POST', '/custom')(async (data, params) => {
    return { data, queryParams: params.query, routeParams: params.route };
  }),
};

app.use('some', someService, {
  methods: ['find', 'custom'],
  events: []
});
```

#### **Typescript with decorators**

```typescript
import { customMethod } from 'feathers-swagger';

class SomeService {
  async find(param: Params) {
    return [];
  }
  
  @customMethod('POST', '/custom')
  async custom(data: any, params: Params) {
    return { data, queryParams: params.query, routeParams: params.route };
  }
}

app.use('some', new SomeService(options), {
  methods: ['find', 'custom'],
  events: []
});
```

<!-- tabs:end -->

<!-- tabs:start -->
### **How to document custom methods**

`feathers-swagger` allows you to pass a `Request` and `Response` schema to document what your custom method expects and returns. 

```typescript
export const userApproveRequest = Type.Object(
  {
    userMessage: Type.String({
      description: 'A message by the user'
    })
  },
  {
    $id: 'userApproveRequest',
    additionalProperties: false
  }
)

export const userApproveResponse = Type.Object(
  {
   successMessage: Type.String()
  },
  {
    $id: 'userApproveResponse',
    additionalProperties: false
  }
)
```

In `createSwaggerServiceOptions` you can pass these new schemas 

```typescript
 docs: createSwaggerServiceOptions({
	schemas: {..., userApproveRequest, userApproveResponse},
    ...
 })
```

<!-- tabs:end -->

## Example

Check out the [example](/examples/custom_methods.md) to see it in action. 

## Limitations

- In Feathers 4 the custom methods are registered after the default methods of a service and therefore
  the /service/:id route will "win" over a /service/custom route for all methods but POST.
- At least one default method has to be existent in a service to be registered
