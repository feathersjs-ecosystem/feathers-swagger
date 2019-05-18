const { assignWithSet } = require('./helpers');

exports.tag = function tag (name, options = {}) {
  const result = {
    name,
    description: options.description || `A ${name} service`
  };

  if (options.externalDocs) {
    result.externalDocs = options.externalDocs;
  }

  return result;
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
  const operation = {};
  if (service.docs && service.docs.operations) {
    Object.assign(operation, service.docs.operations.all || {}, service.docs.operations[method] || {});
  }

  if (service[method].docs) {
    Object.assign(operation, service[method].docs);
  }

  return assignWithSet({}, specDefaults, defaults, operation);
};

exports.security = function security (method, securities, security) {
  if (securities.includes(method) || securities.includes('all')) {
    return security;
  }

  return [];
};
