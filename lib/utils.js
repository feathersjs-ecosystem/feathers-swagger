'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.property = property;
exports.definition = definition;
exports.tag = tag;
exports.operation = operation;
exports.getType = getType;
exports.getFormat = getFormat;
exports.applyJsdoc = applyJsdoc;
const jsdoc = require('jsdoc-api');
const _ = require('lodash');
const supportedMethods = ['find', 'get', 'create', 'update', 'patch', 'remove'];

function property(type, items) {
  const result = {
    type: getType(type),
    format: getFormat(type)
  };

  if (type === 'ARRAY') {
    const isUndefined = typeof items === 'undefined';
    const isString = typeof items === 'string';

    if (isUndefined) {
      result.items = { type: getType('INTEGER') };
    } else if (isString) {
      result.items = { '$ref': '#/definitions/' + items };
    } else {
      result.items = { type: getType(items.key) };
    }
  }

  return result;
}

function definition(model, options = { type: 'object' }) {
  const result = {
    type: options.type,
    properties: {}
  };
  const keys = typeof model.attributes !== 'undefined' ? Object.keys(model.attributes) : [];

  keys.forEach(function (attrName) {
    const attr = model.attributes[attrName];
    const attrType = typeof attr.key !== 'undefined' ? attr.key : attr.type.constructor.prototype.key;
    const prop = property(attrType, model.attributes[attrName].type);

    result.properties[attrName] = prop;
  });

  const allOf = (options.extends || []).map(item => {
    return {
      '$ref': '#definitions/' + item
    };
  });

  allOf.push(result);

  return {
    description: options.description,
    allOf
  };
}

function tag(name, options = {}) {
  return {
    name,
    description: options.description || `A ${name} service`,
    externalDocs: options.externalDocs || {}
  };
}

function operation(method, service, defaults = {}) {
  const operation = service.docs[method] || {};

  operation.parameters = operation.parameters || defaults.parameters || [];
  operation.responses = operation.responses || defaults.responses || [];
  operation.description = operation.description || defaults.description || '';
  operation.summary = operation.summary || defaults.summary || '';
  operation.tags = operation.tags || defaults.tags || [];
  operation.consumes = operation.consumes || defaults.consumes || [];
  operation.produces = operation.produces || defaults.produces || [];
  operation.security = operation.security || defaults.security || [];
  operation.securityDefinitions = operation.securityDefinitions || defaults.securityDefinitions || [];
  // Clean up
  delete service.docs[method]; // Remove `find` from `docs`

  return operation;
}

function getType(type) {
  switch (type) {
    case 'STRING':
    case 'CHAR':
    case 'TEXT':
    case 'BLOB':
    case 'DATE':
    case 'DATEONLY':
    case 'TIME':
    case 'NOW':
      return 'string';
    case 'INTEGER':
    case 'BIGINT':
      return 'integer';
    case 'FLOAT':
    case 'DOUBLE':
    case 'DECIMAL':
      return 'number';
    case 'BOOLEAN':
      return 'boolean';
    case 'ARRAY':
      return 'array';
    default:
      return '';
  }
}

function getFormat(type) {
  switch (type) {
    case 'INTEGER':
    case 'DECIMAL':
      return 'int32';
    case 'BIGINT':
      return 'int64';
    case 'FLOAT':
      return 'float';
    case 'DOUBLE':
      return 'double';
    case 'DATE':
    case 'DATEONLY':
      return 'date';
    case 'TIME':
    case 'NOW':
      return 'date-time';
    default:
      return '';
  }
}

/**
 * Decorate a Feathers service class to incorporate jsdoc comments into its docs
 * object that is supported by this plugin
 *
 * @param {Service} ServiceClass - service class to be decorated
 * @return {Service} decorated service class
 */
function applyJsdoc(ServiceClass) {
  const curDocs = new ServiceClass().docs;
  const rawJsDocs = jsdoc.explainSync({
    source: ServiceClass.toString()
  });

  const jsDocs = _.reduce(rawJsDocs, (acc, v) => {
    if (v.description && _.includes(supportedMethods, v.name)) {
      acc[v.name] = {
        description: v.description
      };
    }
    return acc;
  }, {});

  const newDocs = _.assign(jsDocs, curDocs);

  class NewServiceClass extends ServiceClass {
    constructor(...args) {
      super(...args);
      this.docs = newDocs;
    }
  }

  return NewServiceClass;
}