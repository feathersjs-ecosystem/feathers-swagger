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
    version = version ? ` ${version[0]}` : '';
    const apiPath = path.replace(this.config.prefix, '');
    const group = apiPath.split('/');
    const tag = (apiPath.indexOf('/') > -1 ? group[0] : apiPath) + version;
    const model = apiPath.indexOf('/') > -1 ? group[1] : apiPath;
    const security = [];

    if (this.config.include.tags.length && this.config.include.tags.indexOf(tag) === -1) {
      return;
    }

    if (this.config.ignore.tags.indexOf(tag) > -1) {
      return;
    }

    if (this.specs.security && Array.isArray(this.specs.security)) {
      this.specs.security.forEach(function (schema) {
        security.push(schema);
      });
    }

    const pathObj = this.specs.paths;
    const withIdKey = `/${path}/{${idName}}`;
    const withoutIdKey = `/${path}`;
    const securities = doc.securities || [];

    if (typeof doc.definition !== 'undefined') {
      this.specs.definitions[tag] = doc.definition;
      this.specs.definitions[`${tag} list`] = {
        type: 'array',
        items: doc.definition
      };
    }
    if (typeof doc.definitions !== 'undefined') {
      this.specs.definitions = Object.assign(this.specs.definitions, doc.definitions);
    }

    const defaultArgumentObject = {
      tag,
      model,
      idName,
      idType,
      security,
      securities,
      specs: this.specs,
      service,
      config: this.config
    };

    // FIND
    if (typeof service.find === 'function') {
      pathObj[withoutIdKey] = pathObj[withoutIdKey] || {};
      pathObj[withoutIdKey].get = this.operation('find', service, this.config.defaults.find(defaultArgumentObject));
    }

    // GET
    if (typeof service.get === 'function') {
      pathObj[withIdKey] = pathObj[withIdKey] || {};
      pathObj[withIdKey].get = this.operation('get', service, this.config.defaults.get(defaultArgumentObject));
    }

    // CREATE
    if (typeof service.create === 'function') {
      pathObj[withoutIdKey] = pathObj[withoutIdKey] || {};
      pathObj[withoutIdKey].post = this.operation('create', service, this.config.defaults.create(defaultArgumentObject));
    }

    // UPDATE
    if (typeof service.update === 'function') {
      pathObj[withIdKey] = pathObj[withIdKey] || {};
      pathObj[withIdKey].put = this.operation('update', service, this.config.defaults.update(defaultArgumentObject));
    }

    // PATCH
    if (typeof service.patch === 'function') {
      pathObj[withIdKey] = pathObj[withIdKey] || {};
      pathObj[withIdKey].patch = this.operation('patch', service, this.config.defaults.patch(defaultArgumentObject));
    }

    // REMOVE
    if (typeof service.remove === 'function') {
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
