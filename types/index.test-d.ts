import { expectType } from 'tsd';
import swagger, {
  ServiceSwaggerAddon,
  SwaggerService,
  GetOperationArgsOptions,
  operation,
  tag,
  security,
  idPathParameters,
  swaggerUI, FnUiInit,
} from './index';

// complete
expectType<() => void>(swagger({
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
    getOperationsRefs(model: string, service: SwaggerService<any>) {
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
    schemasGenerator(service: SwaggerService<any>, model: string, modelName: string, schemas: {}) {
      return {
        some: 'schemas',
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
      updateMulti() { return {}; },
      patchMulti() { return {}; },
      removeMulti() { return {}; },
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
      updateMulti: {},
      patchMulti: {},
      removeMulti: {},
      customMethod: {},
      all: {
        'some.path.to.update': 'text',
        anObject: {}
      },
    },
    multi: ['update', 'remove', 'patch', 'all'],
  },
  docsJsonPath: '/swagger.json',
  docsPath: '/swagger',
  idType: 'string',
  openApiVersion: 2,
  prefix: 'api',
  versionPrefix: /v\d+/,
  ui: () => {},
  ignore: {
    paths: ['api/message', /api\/ab*/],
    tags: ['tagname', 'tag2'],
  },
  include: {
    paths: ['api/message', /api\/ab*/],
    tags: ['tagname', 'tag3'],
  },
}));

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

// apiVersion 3
swagger({
  specs: {
    info: {
      description: 'My test description',
      title: 'Title of Tests',
      version: '1.0.0'
    }
  },
  openApiVersion: 3,
});

// empty sub objects
swagger({
  specs: {
    info: {
      description: 'My test description',
      title: 'Title of Tests',
      version: '1.0.0'
    }
  },
  ignore: {},
  include: {},
  defaults: {},
});

// @ts-expect-error
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
    idType: 'string',
    idNames: {
      get: 'id',
      update: 'id',
      patch: 'id',
      remove: 'id',
    },
    definition: {
      type: 'string'
    },
    definitions: {
      'custom-model': {
        type: 'object',
      }
    },
    securities: ['create', 'find', 'get', 'update', 'remove', 'patch', 'all', 'customMethod'],
    multi: ['update', 'remove', 'patch', 'all'],
    operations: {
      find: { any: 'key' },
      get: { any: 'key' },
      create: { any: 'key' },
      update: { any: 'key' },
      patch: { any: 'key' },
      remove: { any: 'key' },
      updateMulti: { any: 'key' },
      patchMulti: { any: 'key' },
      removeMulti: { any: 'key' },
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
      patchMultiRequest: 'model',
      patchMultiResponse: 'model',
      removeResponse: 'model',
      removeMultiResponse: 'model',
      updateRequest: 'model',
      updateResponse: 'model',
      updateMultiRequest: 'model',
      updateMultiResponse: 'model',
      customMethodRequest: 'model',
      customMethodResponse: 'model',
    },
    pathParams: {
      testParam: { any: 'key' },
    },
    overwriteTagSpec: true,
  }
};

// test empty refs, idNames + disabled methods
const serviceEmptyRefs: ServiceSwaggerAddon = {
  docs: {
    operations: {
      find: false,
      get: false,
      create: false,
      update: false,
      patch: false,
      remove: false,
      updateMulti: false,
      patchMulti: false,
      removeMulti: false,
      customMethod: false,
    },
    refs: {},
    idNames: {},
  }
};

// array idType
const serviceIdTypeArray: ServiceSwaggerAddon = {
  docs: {
    idType: ['string', 'integer'],
    idNames: {
      get: ['firstName', 'secondName'],
      patch: ['firstName', 'secondName'],
      remove: ['firstName', 'secondName'],
      update: ['firstName', 'secondName'],
    }
  }
};

// empty docs object
const serviceEmpty: ServiceSwaggerAddon = {
  docs: {}
};

// @ts-expect-error
const wrongService: ServiceSwaggerAddon = {};

/**
 * Swagger UI tests
 */
expectType<FnUiInit>(swaggerUI({}));

expectType<FnUiInit>(swaggerUI({
  docsPath: '/path',
  indexFile: '/path/to/file',
  getSwaggerInitializerScript: (options) => 'string',
}));

/*
 * Utils tests
 */
const swaggerService: SwaggerService<any> = {} as any as SwaggerService<any>;

operation('find', swaggerService, { any: 'thing' });
operation('create', swaggerService, {}, { any: 'thing' });
// @ts-expect-error
operation([]);
// @ts-expect-error
operation('name', {}, {});
// @ts-expect-error
operation('name', swaggerService, 'wrong');

tag('name');
tag('name', { description: 'test' });
// @ts-expect-error
tag([]);

security(
  'find',
  ['get', 'all', 'find', 'create', 'patch', 'update', 'remove', 'patchMulti', 'updateMulti', 'removeMulti',
    'customMethod'],
  [{any: 'thing'}]
);
// @ts-expect-error
security([], [], [{ any: 'thing' }]);
// @ts-expect-error
security('find', [], ['wrong']);

idPathParameters('id', ',');
idPathParameters(['first', 'second'], ',');
// @ts-expect-error
idPathParameters(12, ',');
// @ts-expect-error
idPathParameters([12, 13], ',');
// @ts-expect-error
idPathParameters('id', 12);
