const { assignWithSet } = require('./helpers');

exports.getType = function getType (type) {
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
};

exports.getFormat = function getFormat (type) {
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
};

exports.property = function property (type, items) {
  const result = {
    type: exports.getType(type),
    format: exports.getFormat(type)
  };

  if (type === 'ARRAY') {
    const isUndefined = typeof items === 'undefined';
    const isString = typeof items === 'string';

    if (isUndefined) {
      result.items = { type: exports.getType('INTEGER') };
    } else if (isString) {
      result.items = { $ref: `#/definitions/${items}` };
    } else {
      result.items = { type: exports.getType(items.key) };
    }
  }

  return result;
};

exports.definition = function definition (model, options = { type: 'object' }) {
  const result = {
    type: options.type,
    properties: {}
  };
  const keys = typeof model.attributes !== 'undefined' ? Object.keys(model.attributes) : [];

  keys.forEach(function (attrName) {
    const attr = model.attributes[attrName];
    const attrType = typeof attr.key !== 'undefined' ? attr.key : attr.type.constructor.prototype.key;
    const prop = exports.property(attrType, model.attributes[attrName].type);

    result.properties[attrName] = prop;
  });

  const allOf = (options.extends || []).map(item => {
    return {
      $ref: `#definitions/${item}`
    };
  });

  allOf.push(result);

  return {
    description: options.description,
    allOf
  };
};

exports.tag = function tag (name, options = {}) {
  return {
    name,
    description: options.description || `A ${name} service`,
    externalDocs: options.externalDocs || undefined
  };
};

const v2OperationDefaults = {
  parameters: [],
  responses: {},
  description: '',
  summary: '',
  tags: [],
  consumes: [],
  produces: [],
  security: []
};

exports.operation = function operation (method, service, defaults = {}, specDefaults = v2OperationDefaults) {
  const operation = Object.assign(service.docs[method] || {}, service[method].docs || {}, service.docs.__all || {});

  // Clean up
  delete service.docs[method]; // Remove method from `docs`;

  return assignWithSet({}, specDefaults, defaults, operation);
};
