const _ = require('lodash');
const utils = require('./utils');

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
      defaults: this.getDefaults()
    });

    this.specs = _.defaultsDeep(specs, config.specs, this.getDefaultSpecs());

    this.addService = this.addService.bind(this);
    this.operation = this.getOperationUtil();
  }

  getDefaultSpecs () {} // has to be implemented in sub class
  getDefaults () {} // has to be implemented in sub class
  getOperationUtil () {} // has to be implemented in sub class
  getOperationArgs ({ service, path, config, apiPath, version }) {} // has to be implemented in sub class
  applyDefinitionsToSpecs (service, model) {} // has to implemented in sub class

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
      Object.assign(refs, this.config.defaults.getOperationsRefs(service, model));
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

    // FIND
    if (typeof service.find === 'function' && doc.find !== false) {
      pathObj[withoutIdKey] = pathObj[withoutIdKey] || {};
      pathObj[withoutIdKey].get = this.operation('find', service, this.config.defaults.find(defaultArgumentObject));
    }

    // GET
    if (typeof service.get === 'function' && doc.get !== false) {
      pathObj[withIdKey] = pathObj[withIdKey] || {};
      pathObj[withIdKey].get = this.operation('get', service, this.config.defaults.get(defaultArgumentObject));
    }

    // CREATE
    if (typeof service.create === 'function' && doc.create !== false) {
      pathObj[withoutIdKey] = pathObj[withoutIdKey] || {};
      pathObj[withoutIdKey].post = this.operation('create', service, this.config.defaults.create(defaultArgumentObject));
    }

    // UPDATE
    if (typeof service.update === 'function' && doc.update !== false) {
      pathObj[withIdKey] = pathObj[withIdKey] || {};
      pathObj[withIdKey].put = this.operation('update', service, this.config.defaults.update(defaultArgumentObject));
    }

    // PATCH
    if (typeof service.patch === 'function' && doc.patch !== false) {
      pathObj[withIdKey] = pathObj[withIdKey] || {};
      pathObj[withIdKey].patch = this.operation('patch', service, this.config.defaults.patch(defaultArgumentObject));
    }

    // REMOVE
    if (typeof service.remove === 'function' && doc.remove !== false) {
      pathObj[withIdKey] = pathObj[withIdKey] || {};
      pathObj[withIdKey].delete = this.operation('remove', service, this.config.defaults.remove(defaultArgumentObject));
    }

    this.specs.paths = pathObj;

    const existingTag = this.specs.tags.find(item => item.name === tag);
    if (!existingTag) {
      this.specs.tags.push(utils.tag(tag, doc));
    } else {
      Object.assign(existingTag, utils.tag(tag, doc));
    }
  }
}

module.exports = OpenApiGenerator;
