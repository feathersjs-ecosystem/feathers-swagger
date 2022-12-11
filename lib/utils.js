const { assignWithSet } = require('./helpers');
const { omit, pick } = require('lodash');

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

  if (service[method] && service[method].docs) {
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

exports.idPathParameters = function idPathParameters (idName, idSeparator) {
  return `{${Array.isArray(idName) ? idName.join(`}${idSeparator}{`) : idName}}`;
};

const allowedDefaultRefs = [
  'findResponse',
  'getResponse',
  'createRequest',
  'createResponse',
  'createMultiRequest',
  'createMultiResponse',
  'updateRequest',
  'updateResponse',
  'updateMultiRequest',
  'updateMultiResponse',
  'patchRequest',
  'patchResponse',
  'patchMultiRequest',
  'patchMultiResponse',
  'removeResponse',
  'removeMultiResponse',
  'filterParameter',
  'sortParameter',
  'queryParameters'
];

// Remove non OpenApi properties (properties from https://swagger.io/specification/#schema-object)
exports.defaultSanitizeSchema = function defaultSanitizeSchema (schema) {
  return pick(schema, [
    'title',
    'multipleOf',
    'maximum',
    'exclusiveMaximum',
    'minimum',
    'exclusiveMinimum',
    'maxLength',
    'minLength',
    'pattern',
    'maxItems',
    'minItems',
    'uniqueItems',
    'maxProperties',
    'minProperties',
    'required',
    'enum',
    'type',
    'allOf',
    'oneOf',
    'anyOf',
    'not',
    'items',
    'properties',
    'additionalProperties',
    'description',
    'format',
    'default',
    'nullable',
    'discriminator',
    'readOnly',
    'writeOnly',
    'xml',
    'externalDocs',
    'example',
    'deprecated'
  ]);
};

exports.createSwaggerServiceOptions = function createSwaggerServiceOptions ({ schemas, docs, sanitizeSchema }) {
  const serviceDocs = { schemas: {}, refs: {} };
  const sanitizeSchemaFn = sanitizeSchema || exports.defaultSanitizeSchema;

  let unspecificSchemas;
  const dataSchemaKey = Object.keys(schemas).find(value => value.endsWith('DataSchema'));
  if (dataSchemaKey) {
    const prefix = dataSchemaKey.replace(/DataSchema$/, '');
    const querySchemaKey = `${prefix}QuerySchema`;
    const resultSchemaKey = `${prefix}Schema`;
    if (schemas[dataSchemaKey] && schemas[querySchemaKey] && schemas[resultSchemaKey]) {
      const {
        [dataSchemaKey]: dataSchema,
        [querySchemaKey]: baseQuerySchema,
        [resultSchemaKey]: resultSchema,
        ...otherSchemas
      } = schemas;
      unspecificSchemas = otherSchemas;

      const querySchema = {
        ...baseQuerySchema,
        properties: omit(baseQuerySchema.properties, ['$limit', '$skip'])
      };

      const baseSchemeName = resultSchema.$id || prefix;
      const dataSchemeName = dataSchema.$id || `${baseSchemeName}Data`;
      const querySchemaName = querySchema.$id || `${baseSchemeName}Query`;
      const listSchemaName = `${baseSchemeName}List`;

      const patchSchemaName = `${baseSchemeName}PatchData`;
      const patchSchema = omit(dataSchema, ['required', '$id']);

      serviceDocs.schemas = {
        [baseSchemeName]: sanitizeSchemaFn(resultSchema),
        [dataSchemeName]: sanitizeSchemaFn(dataSchema),
        [querySchemaName]: sanitizeSchemaFn(querySchema),
        [patchSchemaName]: sanitizeSchemaFn(patchSchema),
        [listSchemaName]: {
          type: 'array',
          items: { $ref: `#/components/schemas/${baseSchemeName}` }
        }
      };

      serviceDocs.refs = {
        createRequest: dataSchemeName,
        updateRequest: dataSchemeName,
        patchRequest: patchSchemaName,
        queryParameters: querySchemaName
      };

      if (!docs || !docs.model) {
        serviceDocs.model = baseSchemeName;
      }
    }
  }
  if (unspecificSchemas === undefined) {
    unspecificSchemas = schemas;
  }

  Object.entries(unspecificSchemas).forEach(([key, schema]) => {
    const schemaName = schema.$id;
    if (schemaName) {
      serviceDocs.schemas[schemaName] = sanitizeSchemaFn(schema);
      if (allowedDefaultRefs.includes(key)) {
        serviceDocs.refs[key] = schemaName;
      }
    }
  });

  if (docs) {
    const { schemas, definitions, refs, ...rest } = docs;

    if (schemas || definitions) {
      Object.assign(serviceDocs.schemas, schemas || definitions);
    }

    if (refs) {
      Object.assign(serviceDocs.refs, refs);
    }

    Object.assign(serviceDocs, rest);
  }

  return serviceDocs;
};
