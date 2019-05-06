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
  const operation = Object.assign(service.docs[method] || {}, service[method].docs || {}, service.docs.__all || {});

  // Clean up
  delete service.docs[method]; // Remove method from `docs`;

  return assignWithSet({}, specDefaults, defaults, operation);
};

exports.security = function security (method, securities, security) {
  if (securities.includes(method) || securities.includes('__all')) {
    return security;
  }

  return [];
};
