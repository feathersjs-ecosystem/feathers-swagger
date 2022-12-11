const _ = require('lodash');
const utils = require('./utils');
const { assignWithSet } = require('./helpers');
const { getCustomMethods } = require('./custom-methods');

const serviceMethods = ['find', 'get', 'create', 'update', 'patch', 'remove'];

const defaultMethods = [
  { operation: 'find', method: 'find', id: false, httpMethod: 'get', multi: false },
  { operation: 'get', method: 'get', id: true, httpMethod: 'get', multi: false },
  { operation: 'create', method: 'create', id: false, httpMethod: 'post', multi: false },
  { operation: 'update', method: 'update', id: true, httpMethod: 'put', multi: false },
  { operation: 'patch', method: 'patch', id: true, httpMethod: 'patch', multi: false },
  { operation: 'remove', method: 'remove', id: true, httpMethod: 'delete', multi: false },
  { operation: 'updateMulti', method: 'update', id: false, httpMethod: 'put', multi: true },
  { operation: 'patchMulti', method: 'patch', id: false, httpMethod: 'patch', multi: true },
  { operation: 'removeMulti', method: 'remove', id: false, httpMethod: 'delete', multi: true }
];

function ignoreService (service, path, includeConfig, ignoreConfig) {
  let includedByPath, includedByFilter, excludedByPath, excludedByFilter;

  if (includeConfig.paths.length) {
    includedByPath = includeConfig.paths.some(pathToInclude => path.match(pathToInclude) !== null);
  }
  if (_.isFunction(includeConfig.filter)) {
    includedByFilter = includeConfig.filter(service, path);
  }

  if (includedByPath !== undefined || includedByFilter !== undefined) {
    return !(includedByPath === true || includedByFilter === true);
  }

  if (ignoreConfig.paths.length) {
    excludedByPath = ignoreConfig.paths.some(pathToIgnore => path.match(pathToIgnore) !== null);
  }

  if (_.isFunction(ignoreConfig.filter)) {
    excludedByFilter = ignoreConfig.filter(service, path);
  }

  if (excludedByPath !== undefined || excludedByFilter !== undefined) {
    return excludedByPath === true || excludedByFilter === true;
  }

  return false;
}

function determineMultiOperations (service) {
  if (service.options && service.options.multi) {
    return ['remove', 'update', 'patch', 'create'].filter((operation) => _.isFunction(service[operation]));
  }

  return [];
}

class OpenApiGenerator {
  constructor (app, specs, config) {
    this.app = app;
    this.config = _.defaultsDeep({}, config, {
      include: {
        tags: [],
        paths: []
      },
      ignore: {
        tags: [],
        paths: []
      },
      defaults: {
        operationGenerators: {},
        operations: {}
      }
    });

    this.specs = _.defaultsDeep(specs, config.specs, this.getDefaultSpecs());

    this.addService = this.addService.bind(this);
    this.operationDefaults = this.getOperationDefaults();
    this.operationSpecDefaults = this.getOperationSpecDefaults();
  }

  /* istanbul ignore next: abstract method */
  getDefaultSpecs () {} // has to be implemented in sub class
  /* istanbul ignore next: abstract method */
  getOperationDefaults () {} // has to be implemented in sub class
  /* istanbul ignore next: abstract method */
  applyDefinitionsToSpecs (service, model, modelName, refs) {} // has to implemented in sub class
  /* istanbul ignore next: abstract method */
  getPathParameterSpec (name) {} // has to implemented in sub class
  /* istanbul ignore next: abstract method */
  getOperationsRefs (service, model) {} // has to implemented in sub class
  getOperationSpecDefaults () { return undefined; }

  getOperationArgs ({ service, apiPath, version }) {
    const group = apiPath.split('/');
    const tag = service.docs.tag
      ? service.docs.tag
      : (apiPath.indexOf('/') > -1 ? group[0] : apiPath) + (version ? ` ${version}` : '');
    const tags = service.docs.tags ? service.docs.tags : [tag];
    const model = service.docs.model
      ? service.docs.model
      : (apiPath.indexOf('/') > -1 ? group[1] : apiPath) + (version ? `_${version}` : '');
    const security = [];

    if (this.specs.security && Array.isArray(this.specs.security)) {
      this.specs.security.forEach(function (schema) {
        security.push(schema);
      });
    }
    const securities = service.docs.securities || [];

    return {
      tag,
      tags,
      model,
      modelName: model,
      security,
      securities
    };
  }

  getSchemaNames (serviceSchemaNames = {}, defaultSchemaNames = {}) {
    return {
      list: serviceSchemaNames.list || defaultSchemaNames.list || ((model) => `${model}List`),
      pagination: serviceSchemaNames.pagination || defaultSchemaNames.pagination || ((model) => `${model}Pagination`)
    };
  }

  addService (service, path, serviceOptions) {
    if (ignoreService(service, path, this.config.include, this.config.ignore)) {
      return;
    }

    service.docs = service.docs || (serviceOptions || {}).docs || {};

    // Load documentation from service, if available.
    const doc = service.docs;
    if (doc.operations === undefined) {
      doc.operations = {};
    }

    // disable methods that are not defined for feathers 5
    if (serviceOptions && Array.isArray(serviceOptions.methods)) {
      serviceMethods.forEach(serviceMethod => {
        if (!serviceOptions.methods.includes(serviceMethod)) {
          doc.operations[serviceMethod] = false;
        }
      });
    }

    const idName = service.id || 'id';
    const idType = doc.idType || this.config.idType || 'integer';
    let version = this.config.versionPrefix ? path.match(this.config.versionPrefix) : null;
    version = version ? version[0] : '';
    const apiPath = path.replace(this.config.prefix, '');

    const operationArgs = this.getOperationArgs({ service, path, config: this.config, apiPath, version });
    if (typeof this.config.defaults.getOperationArgs === 'function') {
      Object.assign(
        operationArgs,
        this.config.defaults.getOperationArgs({ service, path, config: this.config, apiPath, version })
      );
    }
    Object.assign(operationArgs, _.pick(doc, ['tag', 'tags', 'model', 'modelName']));
    let { tags } = operationArgs;
    const { tag, model, modelName } = operationArgs;

    if (this.config.include.tags.length) {
      tags = _.intersection(this.config.include.tags, tags);
    }
    tags = _.difference(tags, this.config.ignore.tags);

    if (!tags.length) {
      return;
    }

    const pathObj = this.specs.paths;
    const basePath = `/${path}`;
    const multiOperations = doc.multi || this.config.defaults.multi || determineMultiOperations(service);
    const idSeparator = (service.options && service.options.idSeparator) || ',';

    const schemaNames = this.getSchemaNames(doc.schemaNames, this.config.defaults.schemaNames);
    const refs = this.getOperationsRefs(service, model, schemaNames);

    this.applyDefinitionsToSpecs(service, model, modelName, refs, schemaNames);

    const defaultArgumentObject = {
      idName,
      idType,
      ...operationArgs,
      tags,
      refs,
      specs: this.specs,
      service,
      config: this.config,
      multiOperations
    };

    const addMethodToSpecs = (pathObj, path, methodIdName, method, httpMethod, customMethod = false) => {
      let defaults;

      let swaggerPath = path;
      if (methodIdName) {
        swaggerPath += `/${utils.idPathParameters(methodIdName, idSeparator)}`;
      }

      if (customMethod) {
        const withId = path.includes(':__feathersId');
        swaggerPath = swaggerPath.replace(':__feathersId', utils.idPathParameters(idName, idSeparator));
        const generator = typeof this.config.defaults.operationGenerators.custom === 'function'
          ? this.config.defaults.operationGenerators.custom
          : this.operationDefaults.custom;
        defaults = generator(defaultArgumentObject, { method, httpMethod, withId });
      } else {
        const generator = typeof this.config.defaults.operationGenerators[method] === 'function'
          ? this.config.defaults.operationGenerators[method]
          : this.operationDefaults[method];
        defaults = generator(methodIdName ? { ...defaultArgumentObject, idName: methodIdName } : defaultArgumentObject);
      }

      if (defaults === false || this.config.defaults.operations[method] === false) {
        return;
      }

      if (typeof this.config.defaults.operations[method] === 'object') {
        assignWithSet(defaults, this.config.defaults.operations[method]);
      }
      if (typeof this.config.defaults.operations.all === 'object') {
        assignWithSet(defaults, this.config.defaults.operations.all);
      }

      // add path parameters
      const pathParameters = [];
      swaggerPath = swaggerPath.replace(/\/:([^/]+)/g, (match, parameterName) => {
        if (service.docs.pathParams && service.docs.pathParams[parameterName]) {
          pathParameters.push(service.docs.pathParams[parameterName]);
        } else {
          pathParameters.push(this.getPathParameterSpec(parameterName));
        }
        return `/{${parameterName}}`;
      });
      pathParameters.reverse().forEach(pathParameter => {
        assignWithSet(defaults, { 'parameters[-]': pathParameter });
      });

      pathObj[swaggerPath] = pathObj[swaggerPath] || {};
      pathObj[swaggerPath][httpMethod] = utils.operation(method, service, defaults, this.operationSpecDefaults);

      usedTags.push(...pathObj[swaggerPath][httpMethod].tags);
    };

    const usedTags = [];
    defaultMethods.forEach(({ operation, method, httpMethod, id: withId, multi }) => {
      if (multi && !(multiOperations.includes(method) || multiOperations.includes('all'))) {
        return;
      }

      if (typeof service[method] === 'function' && doc.operations[operation] !== false) {
        let operationIdName;
        if (withId) {
          operationIdName = (doc.idNames && doc.idNames[operation]) ? doc.idNames[operation] : idName;
        }
        addMethodToSpecs(pathObj, basePath, operationIdName, operation, httpMethod);
      }
    });

    getCustomMethods(this.app, service, defaultMethods, basePath, doc, serviceOptions).forEach(({ path, method, httpMethod }) => {
      addMethodToSpecs(pathObj, path, undefined, method, httpMethod, true);
    });

    this.specs.paths = pathObj;

    if (usedTags.includes(tag)) {
      const existingTag = this.specs.tags.find(item => item.name === tag);
      if (!existingTag) {
        this.specs.tags.push(utils.tag(tag, doc));
      } else if (doc.overwriteTagSpec) {
        Object.assign(existingTag, utils.tag(tag, doc));
      }
    }
  }
}

module.exports = OpenApiGenerator;
