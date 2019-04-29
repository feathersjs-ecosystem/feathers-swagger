exports.operation = function operation (method, service, defaults = {}) {
  const operation = Object.assign(service.docs[method] || {}, service[method].docs || {});

  operation.parameters = operation.parameters || defaults.parameters || [];
  operation.responses = operation.responses || defaults.responses || {};
  operation.description = operation.description || defaults.description || '';
  operation.summary = operation.summary || defaults.summary || '';
  operation.tags = operation.tags || defaults.tags || [];
  operation.security = operation.security || defaults.security || undefined;
  // Clean up
  delete service.docs[method]; // Remove method from `docs`

  return operation;
};
