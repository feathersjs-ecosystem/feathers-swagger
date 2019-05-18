import swagger, {
  ServiceSwaggerAddon,
  SwaggerService,
  GetOperationArgsOptions,
  operation,
  tag,
  security,
} from 'feathers-swagger';

// complete
// $ExpectType () => void
swagger({
  specs: {
    info: {
      description: 'My test description',
      title: 'Title of Tests',
      version: '1.0.0'
    }
  },
  appProperty: 'docs',
  defaults: {
    getOperationArgs({ service, config, apiPath, path, version }: GetOperationArgsOptions) { return {}; },
    getOperationRefs(model: string, service: SwaggerService<any>) {
      return {
        createRequest: 'model',
        createResponse: 'model',
        findResponse: 'model',
        getResponse: 'model',
        patchRequest: 'model',
        patchResponse: 'model',
        removeResponse: 'model',
        updateRequest: 'model',
        updateResponse: 'model',
        customResponse: 'model',
        customRequest: 'model',
      };
    },
    operationGenerators: {
      find(
        {
          config,
          service,
          securities,
          idName,
          idType,
          model,
          modelName,
          refs,
          security,
          tag,
          tags,
          additionalAlsoAllowed
        }
      ) { return {}; },
      get() { return {}; },
      create() { return {}; },
      update() { return {}; },
      patch() { return {}; },
      remove() { return {}; },
      custom(
        {
          config,
          service,
          securities,
          idName,
          idType,
          model,
          modelName,
          refs,
          security,
          tag,
          tags,
          additionalAlsoAllowed
        },
        {
          method,
          httpMethod,
          withId
        }
      ) { return {}; },
    },
    operations: {
      find: {},
      get: {},
      create: {},
      update: {},
      patch: {},
      remove: {},
      customMethod: {},
      all: {
        'some.path.to.update': 'text',
        anObject: {}
      },
    },
  },
  docsJsonPath: '/swagger.json',
  docsPath: '/swagger',
  idType: 'string',
  openApiVersion: 2,
  prefix: 'api',
  versionPrefix: /v\d+/,
  uiIndex: false,
  ignore: {
    paths: ['api/message', /api\/ab*/],
    tags: ['tagname', 'tag2'],
  },
  include: {
    paths: ['api/message', /api\/ab*/],
    tags: ['tagname', 'tag3'],
  },
});

// only the required options
swagger({
  specs: {
    info: {
      description: 'My test description',
      title: 'Title of Tests',
      version: '1.0.0'
    }
  },
});

// alternative uiIndex string, apiVersion 3
swagger({
  specs: {
    info: {
      description: 'My test description',
      title: 'Title of Tests',
      version: '1.0.0'
    }
  },
  openApiVersion: 3,
  uiIndex: 'path/to/index.html',
});

// alternative uiIndex function, empty sub objects
swagger({
  specs: {
    info: {
      description: 'My test description',
      title: 'Title of Tests',
      version: '1.0.0'
    }
  },
  uiIndex(req, res) {
  },
  ignore: {},
  include: {},
  defaults: {},
});

// $ExpectError
swagger({});

// test all
const service: ServiceSwaggerAddon = {
  docs: {
    description: 'My description',
    tag: 'tag',
    externalDocs: {
      description: 'find more info here',
      url: 'https://swagger.io/about',
    },
    tags: ['tag1', 'tag2'],
    model: 'custom-model',
    modelName: 'Nice name of my Model',
    definition: {
      type: 'string'
    },
    definitions: {
      'custom-model': {
        type: 'object',
      }
    },
    securities: ['create', 'find', 'get', 'update', 'remove', 'patch', 'all', 'customMethod'],
    operations: {
      find: { any: 'key' },
      get: { any: 'key' },
      create: { any: 'key' },
      update: { any: 'key' },
      patch: { any: 'key' },
      remove: { any: 'key' },
      all: { any: 'key' },
      customMethod: { any: 'key' },
    },
    refs: {
      createRequest: 'model',
      createResponse: 'model',
      findResponse: 'model',
      getResponse: 'model',
      patchRequest: 'model',
      patchResponse: 'model',
      removeResponse: 'model',
      updateRequest: 'model',
      updateResponse: 'model',
      customMethodRequest: 'model',
      customMethodResponse: 'model',
    },
    pathParams: {
      testParam: { any: 'key' },
    }
  }
};

// test empty refs + disabled methods
const serviceEmptyRefs: ServiceSwaggerAddon = {
  docs: {
    operations: {
      find: false,
      get: false,
      create: false,
      update: false,
      patch: false,
      remove: false,
      customMethod: false,
    },
    refs: {},
  }
};

// empty docs object
const serviceEmpty: ServiceSwaggerAddon = {
  docs: {}
};

// $ExpectError
const wrongService: ServiceSwaggerAddon = {};

/*
 * Utils tests
 */
const swaggerService: SwaggerService<any> = {} as any as SwaggerService<any>;

operation('find', swaggerService, { any: 'thing' });
operation('create', swaggerService, {}, { any: 'thing' });
// $ExpectError
operation([]);
// $ExpectError
operation('name', {}, {});
// $ExpectError
operation('name', swaggerService, 'wrong');

tag('name');
tag('name', { description: 'test' });
// $ExpectError
tag([]);

security('find', ['get', 'all', 'find', 'create', 'patch', 'update', 'remove', 'customMethod'], [{ any: 'thing' }]);
// $ExpectError
security([], [], [{ any: 'thing' }]);
// $ExpectError
security('find', [], ['wrong']);
