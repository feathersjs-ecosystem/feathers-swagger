const _ = require('lodash');
const utils = require('./utils');
const { assignWithSet } = require('./helpers');

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

function getHttpMethodSymbol () {
  try {
    const rest = require('@feathersjs/express/rest');
    /* istanbul ignore else: for @feathers/express versions < 4 */
    if (rest.HTTP_METHOD) {
      return rest.HTTP_METHOD;
    }
  } catch (e) {}
  /* istanbul ignore next: for @feathers/express versions < 4 */
  return null;
}

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

class OpenApiGenerator {
  constructor (specs, config) {
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
        operations: {},
        multi: []
      }
    });

    this.specs = _.defaultsDeep(specs, config.specs, this.getDefaultSpecs());

    this.addService = this.addService.bind(this);
    this.operationDefaults = this.getOperationDefaults();
    this.operationSpecDefaults = this.getOperationSpecDefaults();
    this.customMethodSymbol = getHttpMethodSymbol();
  }

  /* istanbul ignore next: abstract method */
  getDefaultSpecs () {} // has to be implemented in sub class
  /* istanbul ignore next: abstract method */
  getOperationDefaults () {} // has to be implemented in sub class
  /* istanbul ignore next: abstract method */
  applyDefinitionsToSpecs (service, model) {} // has to implemented in sub class
  /* istanbul ignore next: abstract method */
  getPathParameterSpec (name) {} // has to implemented in sub class
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

  getOperationsRefs (service, model) {
    const modelList = `${model}_list`;
    const refs = {
      findResponse: modelList,
      getResponse: model,
      createRequest: model,
      createResponse: model,
      updateRequest: model,
      updateResponse: model,
      updateMultiRequest: modelList,
      updateMultiResponse: modelList,
      patchRequest: model,
      patchResponse: model,
      patchMultiRequest: model,
      patchMultiResponse: modelList,
      removeResponse: model,
      removeMultiResponse: modelList,
      filterParameter: model,
      sortParameter: ''
    };
    if (typeof this.config.defaults.getOperationsRefs === 'function') {
      Object.assign(refs, this.config.defaults.getOperationsRefs(model, service));
    }
    if (typeof service.docs.refs === 'object') {
      Object.assign(refs, service.docs.refs);
    }
    return refs;
  }

  addService (service, path) {
    if (ignoreService(service, path, this.config.include, this.config.ignore)) {
      return;
    }

    service.docs = service.docs || {};

    // Load documentation from service, if available.
    const doc = service.docs;
    if (doc.operations === undefined) {
      doc.operations = {};
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
    const multiOperations = doc.multi || this.config.defaults.multi;
    const idSeparator = (service.options && service.options.idSeparator) || ',';

    this.applyDefinitionsToSpecs(service, model, modelName);

    const defaultArgumentObject = {
      idName,
      idType,
      ...operationArgs,
      tags,
      refs: this.getOperationsRefs(service, model),
      specs: this.specs,
      service,
      config: this.config
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

    // custom methods
    if (this.customMethodSymbol && service.methods) {
      Object.keys(_.omit(service.methods, Object.keys(defaultMethods))).forEach((method) => {
        const serviceMethod = service[method];
        if (typeof serviceMethod !== 'function' || doc.operations[method] === false) {
          return;
        }
        const httpMethod = serviceMethod[this.customMethodSymbol];
        if (!httpMethod) {
          return;
        }
        httpMethod.forEach(({ verb, uri }) => {
          // add support for id
          const path = `${basePath}${uri}`;
          addMethodToSpecs(pathObj, path, undefined, method, verb.toLowerCase(), true);
        });
      });
    }

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
