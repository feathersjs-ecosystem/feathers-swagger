// TypeScript Version: 2.7

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
    tags?: [string],
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
  patchRequest?: string;
  patchResponse?: string;
  removeResponse?: string;
}

interface FnGetOperationRefs {
  (model: string, service: feathersSwagger.SwaggerService<any>): OperationRefs;
}

interface FnOperationSpecsGenerator {
  (options: {
    tag: string,
    tags: [string],
    model: string,
    modelName: string,
    idName: string,
    idType: string,
    security: [any],
    securities: Securities,
    refs: OperationRefs,
    service: feathersSwagger.SwaggerService<any>,
    config: feathersSwagger.SwaggerInitOptions,
  } & UnknownObject): UnknownObject;
}

interface ExternalDocs {
  description: string;
  url: string;
}

type DefaultsOperation = UnknownObject | FnOperationSpecsGenerator;

type Securities = Array<'find' | 'get' | 'create' | 'update' | 'patch' | 'remove' | '__all'>;

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
      getOperationRefs?: FnGetOperationRefs;
      find?: DefaultsOperation;
      get?: DefaultsOperation;
      create?: DefaultsOperation;
      update?: DefaultsOperation;
      patch?: DefaultsOperation;
      remove?: DefaultsOperation;
      __all?: UnknownObject;
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
    securities?: Securities;
    refs?: OperationRefs;

    find?: UnknownObject | false;
    get?: UnknownObject | false;
    create?: UnknownObject | false;
    update?: UnknownObject | false;
    patch?: UnknownObject | false;
    remove?: UnknownObject | false;
    __all?: UnknownObject;
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
}
