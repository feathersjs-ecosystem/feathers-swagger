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

exports.defaultTransformSchema = function defaultTransformSchema (schema) {
  const allowedProperties = pick(schema, [
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
    'dependentRequired',
    'const',
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
    'deprecated',
    '$ref',
    '$dynamicRef',
    '$anchor',
    '$dynamicAnchor',
    '$recursiveRef',
    '$recursiveAnchor',
    '$defs',
    '$comment'
  ]);

  if (allowedProperties.$ref && !allowedProperties.$ref.includes('#')) {
    allowedProperties.$ref = '#/components/schemas/' + allowedProperties.$ref;
  }

  if (allowedProperties.items) {
    allowedProperties.items = defaultTransformSchema(allowedProperties.items);
  }

  if (allowedProperties.properties) {
    allowedProperties.properties = Object.entries(allowedProperties.properties).reduce(
      (previousValue, [key, value]) => {
        return {
          ...previousValue,
          [key]: defaultTransformSchema(value)
        };
      },
      {}
    );
  }

  return allowedProperties;
};

function determineSchemaPrefix (schemas) {
  const dataSchemaKey = Object.keys(schemas).find(value => value.endsWith('DataSchema'));
  if (dataSchemaKey) {
    return dataSchemaKey.replace(/DataSchema$/, '');
  }
  const querySchemaKey = Object.keys(schemas).find(value => value.endsWith('QuerySchema'));
  if (querySchemaKey) {
    return querySchemaKey.replace(/QuerySchema$/, '');
  }
  const patchSchemaKey = Object.keys(schemas).find(value => value.endsWith('PatchSchema'));
  if (patchSchemaKey) {
    return patchSchemaKey.replace(/PatchSchema$/, '');
  }
  const schemaKey = Object.keys(schemas).find(value => value.endsWith('Schema'));
  if (schemaKey) {
    return schemaKey.replace(/Schema$/, '');
  }

  return undefined;
}

exports.createSwaggerServiceOptions = function createSwaggerServiceOptions ({ schemas, docs, transformSchema }) {
  const serviceDocs = { schemas: {}, refs: {} };
  const transformSchemaFn = transformSchema || exports.defaultTransformSchema;

  let unspecificSchemas;
  const prefix = determineSchemaPrefix(schemas);
  if (prefix) {
    const resultSchemaKey = `${prefix}Schema`;
    const dataSchemaKey = `${prefix}DataSchema`;
    const querySchemaKey = `${prefix}QuerySchema`;
    const patchSchemaKey = `${prefix}PatchSchema`;
    if (schemas[resultSchemaKey]) {
      const {
        [dataSchemaKey]: dataSchema,
        [querySchemaKey]: baseQuerySchema,
        [resultSchemaKey]: resultSchema,
        [patchSchemaKey]: patchSchema,
        ...otherSchemas
      } = schemas;
      unspecificSchemas = otherSchemas;

      const baseSchemeName = resultSchema.$id || prefix;
      const listSchemaName = `${baseSchemeName}List`;

      serviceDocs.schemas = {
        [baseSchemeName]: transformSchemaFn(resultSchema),
        [listSchemaName]: {
          type: 'array',
          items: { $ref: `#/components/schemas/${baseSchemeName}` }
        }
      };

      serviceDocs.refs = {};

      if (dataSchema) {
        const dataSchemeName = dataSchema.$id || `${baseSchemeName}Data`;
        const dataListSchemeName = `${dataSchemeName}List`;

        serviceDocs.schemas[dataSchemeName] = transformSchemaFn(dataSchema);
        serviceDocs.schemas[dataListSchemeName] = {
          type: 'array',
          items: { $ref: `#/components/schemas/${dataSchemeName}` }
        };
        serviceDocs.refs.createRequest = dataSchemeName;
        serviceDocs.refs.createMultiRequest = { refs: [dataSchemeName, dataListSchemeName], type: 'oneOf' };
        serviceDocs.refs.updateRequest = dataSchemeName;
      }

      if (baseQuerySchema) {
        const querySchema = {
          ...baseQuerySchema,
          properties: omit(baseQuerySchema.properties, ['$limit', '$skip'])
        };
        const querySchemaName = querySchema.$id || `${baseSchemeName}Query`;
        serviceDocs.schemas[querySchemaName] = transformSchemaFn(querySchema);
        serviceDocs.refs.queryParameters = querySchemaName;
      }

      if (patchSchema) {
        const patchSchemaName = patchSchema.$id || `${baseSchemeName}PatchData`;
        const patchListSchemeName = `${patchSchemaName}List`;

        serviceDocs.schemas[patchSchemaName] = transformSchemaFn(patchSchema);
        serviceDocs.schemas[patchListSchemeName] = {
          type: 'array',
          items: { $ref: `#/components/schemas/${patchSchemaName}` }
        };

        serviceDocs.refs.patchRequest = patchSchemaName;
        serviceDocs.refs.patchMultiRequest = patchListSchemeName;
      }

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
      serviceDocs.schemas[schemaName] = transformSchemaFn(schema);
      serviceDocs.refs[key] = schemaName;
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
