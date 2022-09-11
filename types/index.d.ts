// TypeScript Version: 3.0

import { Application, Service } from '@feathersjs/feathers';

export = feathersSwagger;

interface UnknownObject {
  [propName: string]: any;
}

interface FnGetOperationArgs {
  (options: feathersSwagger.GetOperationArgsOptions): {
    tag?: string,
    tags?: string[],
    model?: string,
    modelName?: string,
  } & UnknownObject;
}

interface SchemaMultiRef {
  refs: string[];
  type: 'oneOf' | 'allOf' | 'anyOf';
  discriminator?: {
    propertyName: string;
  }
}

type SchemaRef = string | SchemaMultiRef;

interface OperationRefs {
  findResponse?: SchemaRef;
  getResponse?: SchemaRef;
  createRequest?: SchemaRef;
  createResponse?: SchemaRef;
  createMultiRequest?: SchemaRef;
  createMultiResponse?: SchemaRef;
  updateRequest?: SchemaRef;
  updateResponse?: SchemaRef;
  updateMultiRequest?: SchemaRef;
  updateMultiResponse?: SchemaRef;
  patchRequest?: SchemaRef;
  patchResponse?: SchemaRef;
  patchMultiRequest?: SchemaRef;
  patchMultiResponse?: SchemaRef;
  removeResponse?: SchemaRef;
  removeMultiResponse?: SchemaRef;
  [customMethodRef: string]: SchemaRef | undefined;
}

interface FnGetOperationsRefs {
  (model: string, service: feathersSwagger.SwaggerService<any>): OperationRefs;
}

interface FnSchemasGenerator {
  (
    service: feathersSwagger.SwaggerService<any>,
    model: string,
    modelName: string,
    schemas: UnknownObject,
  ): UnknownObject;
}

type FnOperationSpecsGeneratorOptions = {
  tag: string,
  tags: string[],
  model: string,
  modelName: string,
  idName: string | string[],
  idType: string | string[],
  security: any[],
  securities: Securities,
  refs: OperationRefs,
  service: feathersSwagger.SwaggerService<any>,
  config: feathersSwagger.SwaggerInitOptions,
} & UnknownObject;

interface FnOperationSpecsGenerator {
  (options: FnOperationSpecsGeneratorOptions): OperationConfig;
}

interface FnCustomOperationSpecsGenerator {
  (options: FnOperationSpecsGeneratorOptions, customMethodOptions: {
    method: string,
    httpMethod: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'connect' | 'trace',
    withId: boolean,
  }): OperationConfig;
}

interface ExternalDocs {
  description: string;
  url: string;
}

type Securities = Array<'find' | 'get' | 'create' | 'update' | 'patch' | 'remove' | 'updateMulti' | 'patchMulti'
  | 'removeMulti' | 'all' | string>;
type MultiOperations = Array<'update' | 'patch' | 'remove' | 'create' | 'all'>;

declare function feathersSwagger(config: feathersSwagger.SwaggerInitOptions): () => void;

type SpecsObject = {
  info: {
    title: string;
    description?: string;
    version: string;
  } & UnknownObject;
} & UnknownObject;

type OpenApiVersion = 2 | 3;

type OperationConfig = UnknownObject | false;

type Verb = 'POST' | 'GET' | 'PATCH' | 'PUT' | 'DELETE';

declare namespace feathersSwagger {
  interface SwaggerInitOptions {
    specs: SpecsObject;
    openApiVersion?: OpenApiVersion;
    docsPath?: string;
    docsJsonPath?: string;
    ui?: FnUiInit;
    idType?: 'string' | 'integer';
    prefix?: string | RegExp;
    versionPrefix?: RegExp;
    include?: {
      tags?: string[];
      paths?: Array<string | RegExp>;
      filter?: (service: Service<any>, path: string) => boolean;
    };
    ignore?: {
      tags?: string[];
      paths?: Array<string | RegExp>;
      filter?: (service: Service<any>, path: string) => boolean;
    };
    appProperty?: string;
    defaults?: {
      getOperationArgs?: FnGetOperationArgs;
      getOperationsRefs?: FnGetOperationsRefs;
      schemasGenerator?: FnSchemasGenerator;
      operationGenerators?: {
        find?: FnOperationSpecsGenerator;
        get?: FnOperationSpecsGenerator;
        create?: FnOperationSpecsGenerator;
        update?: FnOperationSpecsGenerator;
        patch?: FnOperationSpecsGenerator;
        remove?: FnOperationSpecsGenerator;
        updateMulti?: FnOperationSpecsGenerator;
        patchMulti?: FnOperationSpecsGenerator;
        removeMulti?: FnOperationSpecsGenerator;
        custom?: FnCustomOperationSpecsGenerator;
      }
      operations?: {
        find?: OperationConfig;
        get?: OperationConfig;
        create?: OperationConfig;
        update?: OperationConfig;
        patch?: OperationConfig;
        remove?: OperationConfig;
        updateMulti?: OperationConfig;
        patchMulti?: OperationConfig;
        removeMulti?: OperationConfig;
        all?: UnknownObject;
        [customMethod: string]: OperationConfig | undefined;
      }
      multi?: MultiOperations;
    };
  }

  interface ServiceSwaggerOptions {
    description?: string;
    definition?: UnknownObject;
    definitions?: UnknownObject;
    schema?: UnknownObject;
    schemas?: UnknownObject;
    tag?: string;
    externalDocs?: ExternalDocs;
    tags?: string[];
    model?: string;
    modelName?: string;
    idType?: string | string[];
    idNames?: {
      get?: string | string[];
      update?: string | string[];
      patch?: string | string[];
      remove?: string | string[];
    };
    securities?: Securities;
    refs?: OperationRefs;
    pathParams?: {
      [paramName: string]: UnknownObject;
    };
    overwriteTagSpec?: boolean;
    multi?: MultiOperations;
    operations?: {
      find?: OperationConfig;
      get?: OperationConfig;
      create?: OperationConfig;
      update?: OperationConfig;
      patch?: OperationConfig;
      remove?: OperationConfig;
      updateMulti?: OperationConfig;
      patchMulti?: OperationConfig;
      removeMulti?: OperationConfig;
      all?: UnknownObject;
      [customOperation: string]: OperationConfig | undefined;
    };
  }

  interface FnUiInit {
    (app: Application, config: { specs: SpecsObject, docsJsonPath: string, openApiVersion: OpenApiVersion }): void;
  }

  interface ServiceSwaggerAddon {
    docs: ServiceSwaggerOptions;
  }

  type SwaggerService<T> = Service<T> & ServiceSwaggerAddon & UnknownObject;

  interface GetOperationArgsOptions {
    service: SwaggerService<any>;
    path: string;
    config: SwaggerInitOptions;
    apiPath: string;
    version: string;
  }

  // custom methods
  // only define decorator return type for typescript
  function customMethod(verb: Verb, path: string): (target: any, memberName: string) => void;

  function customMethodsHandler(
    app: Application
  ): void;

  // swagger ui dist
  interface FnSwaggerUiGetInitializerScript {
    (options: {
      docsPath: string;
      docsJsonPath: string;
      specs: SpecsObject;
    }): string;
  }

  function swaggerUI(
    options: {
      docsPath?: string;
      indexFile?: string;
      getSwaggerInitializerScript?: FnSwaggerUiGetInitializerScript;
    }
  ): FnUiInit;

  // Utils
  function operation(
    name: string,
    service: SwaggerService<any>,
    defaults: UnknownObject,
    specDefaults?: UnknownObject
  ): UnknownObject;

  function tag(name: string, options?: {
    description?: string;
    externalDocs?: ExternalDocs;
  }): void;

  function security(method: string, securities: Securities, security: UnknownObject[]): UnknownObject[];

  function idPathParameters(idName: string | string[], idSeparator: string): string;
}

declare module '@feathersjs/adapter-commons' {
  interface AdapterService<T = any> {
    /**
     * Docs for Swagger specification generation
     */
    docs: feathersSwagger.ServiceSwaggerOptions;
  }
}
