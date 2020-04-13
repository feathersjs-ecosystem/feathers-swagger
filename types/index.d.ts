// TypeScript Version: 2.8

import { Request, Response } from 'express';
import { Service } from '@feathersjs/feathers';

export = feathersSwagger;

interface UnknownObject {
  [propName: string]: any;
}

interface UiIndexFn {
  (req: Request, res: Response): any;
}

interface FnGetOperationArgs {
  (options: feathersSwagger.GetOperationArgsOptions): {
    tag?: string,
    tags?: string[],
    model?: string,
    modelName?: string,
  } & UnknownObject;
}

interface OperationRefs {
  findResponse?: string;
  getResponse?: string;
  createRequest?: string;
  createResponse?: string;
  updateRequest?: string;
  updateResponse?: string;
  updateMultiRequest?: string;
  updateMultiResponse?: string;
  patchRequest?: string;
  patchResponse?: string;
  patchMultiRequest?: string;
  patchMultiResponse?: string;
  removeResponse?: string;
  removeMultiResponse?: string;
  [customMethodRef: string]: string | undefined;
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
  (options: FnOperationSpecsGeneratorOptions): UnknownObject;
}

interface FnCustomOperationSpecsGenerator {
  (options: FnOperationSpecsGeneratorOptions, customMethodOptions: {
    method: string,
    httpMethod: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'connect' | 'trace',
    withId: boolean,
  }): UnknownObject;
}

interface ExternalDocs {
  description: string;
  url: string;
}

type Securities = Array<'find' | 'get' | 'create' | 'update' | 'patch' | 'remove' | 'updateMulti' | 'patchMulti'
  | 'removeMulti' | 'all' | string>;
type MultiOperations = Array<'update' | 'patch' | 'remove' | 'all'>;

declare function feathersSwagger(config: feathersSwagger.SwaggerInitOptions): () => void;

declare namespace feathersSwagger {
  interface SwaggerInitOptions {
    specs: {
      info: {
        title: string;
        description?: string;
        version: string;
      } & UnknownObject;
    } & UnknownObject;
    openApiVersion?: 2 | 3;
    docsPath?: string;
    docsJsonPath?: string;
    uiIndex?: boolean | string | UiIndexFn;
    idType?: 'string' | 'integer';
    prefix?: string | RegExp;
    versionPrefix?: RegExp;
    include?: {
      tags?: string[];
      paths?: Array<string | RegExp>;
    };
    ignore?: {
      tags?: string[];
      paths?: Array<string | RegExp>;
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
        find?: UnknownObject;
        get?: UnknownObject;
        create?: UnknownObject;
        update?: UnknownObject;
        patch?: UnknownObject;
        remove?: UnknownObject;
        updateMulti?: UnknownObject;
        patchMulti?: UnknownObject;
        removeMulti?: UnknownObject;
        all?: UnknownObject;
        [customMethod: string]: UnknownObject | undefined;
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
      find?: UnknownObject | false;
      get?: UnknownObject | false;
      create?: UnknownObject | false;
      update?: UnknownObject | false;
      patch?: UnknownObject | false;
      remove?: UnknownObject | false;
      updateMulti?: UnknownObject | false;
      patchMulti?: UnknownObject | false;
      removeMulti?: UnknownObject | false;
      all?: UnknownObject;
      [customOperation: string]: UnknownObject | false | undefined;
    };
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
