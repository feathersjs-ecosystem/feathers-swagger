const _ = require('lodash');
const utils = require('./utils');
const { assignWithSet } = require('./helpers');

const defaultMethods = {
  find: { id: false, method: 'get' },
  get: { id: true, method: 'get' },
  create: { id: false, method: 'post' },
  update: { id: true, method: 'put' },
  patch: { id: true, method: 'patch' },
  remove: { id: true, method: 'delete' }
};

class OpenApiGenerator {
  constructor (app, specs, config) {
    this.config = _.defaultsDeep({}, config, {
      include: {
        tags: [],
        paths: []
      },
      ignore: {
        tags: [],
        paths: []
      },
      defaults: {}
    });

    this.specs = _.defaultsDeep(specs, config.specs, this.getDefaultSpecs());

    this.addService = this.addService.bind(this);
    this.operationDefaults = this.getOperationDefaults();
    this.operationSpecDefaults = this.getOperationSpecDefaults();
  }

  getDefaultSpecs () {} // has to be implemented in sub class
  getOperationDefaults () {} // has to be implemented in sub class
  getOperationSpecDefaults () { return undefined; }
  applyDefinitionsToSpecs (service, model) {} // has to implemented in sub class

  getOperationArgs ({ service, path, config, apiPath, version }) {
    const group = apiPath.split('/');
    const tag = (apiPath.indexOf('/') > -1 ? group[0] : apiPath) + (version ? ` ${version}` : '');
    const model = (apiPath.indexOf('/') > -1 ? group[1] : apiPath) + (version ? `_${version}` : '');
    const security = [];

    if (this.specs.security && Array.isArray(this.specs.security)) {
      this.specs.security.forEach(function (schema) {
        security.push(schema);
      });
    }
    const securities = service.docs.securities || [];

    return {
      tag,
      tags: [tag],
      model,
      modelName: model,
      security,
      securities
    };
  }

  getOperationsRefs (service, model) {
    const refs = {
      findResponse: `${model}_list`,
      getResponse: model,
      createRequest: model,
      createResponse: model,
      updateRequest: model,
      updateResponse: model,
      patchRequest: model,
      patchResponse: model,
      removeResponse: model
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
    if (this.config.include.paths.length &&
      !this.config.include.paths.some(pathToInclude => path.match(pathToInclude) !== null)
    ) {
      return;
    }

    for (const pathToIgnore of this.config.ignore.paths) {
      if (path.match(pathToIgnore) !== null) {
        return;
      }
    }

    service.docs = service.docs || {};

    // Load documentation from service, if available.
    const doc = service.docs;
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
    const { tag, model } = operationArgs;

    if (this.config.include.tags.length) {
      tags = _.intersection(this.config.include.tags, tags);
    }
    tags = _.difference(tags, this.config.ignore.tags);

    if (!tags.length) {
      return;
    }

    const pathObj = this.specs.paths;
    const withIdKey = `/${path}/{${idName}}`;
    const withoutIdKey = `/${path}`;

    this.applyDefinitionsToSpecs(service, model);

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

    const usedTags = [];
    Object.entries(defaultMethods).forEach(([method, { id: withId, method: httpMethod }]) => {
      if (typeof service[method] === 'function' && doc[method] !== false) {
        const path = withId ? withIdKey : withoutIdKey;
        const defaults = typeof this.config.defaults[method] === 'function'
          ? this.config.defaults[method](defaultArgumentObject)
          : this.operationDefaults[method](defaultArgumentObject);

        if (typeof this.config.defaults[method] === 'object') {
          assignWithSet(defaults, this.config.defaults[method]);
        }
        if (typeof this.config.defaults.__all === 'object') {
          assignWithSet(defaults, this.config.defaults.__all);
        }

        pathObj[path] = pathObj[path] || {};
        pathObj[path][httpMethod] = utils.operation(method, service, defaults, this.operationSpecDefaults);

        if (pathObj[path][httpMethod].tags) {
          usedTags.push(...pathObj[path][httpMethod].tags);
        }
      }
    });

    this.specs.paths = pathObj;

    if (usedTags.includes(tag)) {
      const existingTag = this.specs.tags.find(item => item.name === tag);
      if (!existingTag) {
        this.specs.tags.push(utils.tag(tag, doc));
      } else {
        Object.assign(existingTag, utils.tag(tag, doc));
      }
    }
  }
}

module.exports = OpenApiGenerator;
