
'use strict';

module.exports = {
    Definition: function(model, options){
        options = options || {type: 'object'};
        var extnds = options.extends || [],
            result = {
                type: options.type,
                properties: {}
            },
            keys = typeof model.attributes !== 'undefined' ? Object.keys(model.attributes) : [];

        for (var i = 0; i < keys.length; i++) {
            var attrName = keys[i],
                attrType = model.attributes[attrName].key,
                propertie = new module.exports.Propertie(attrType, model.attributes[attrName].type);
            result.properties[attrName] = propertie;
        }

        extnds = extnds.map(function(item){
            return {
                '$ref': '#definitions/'+item
            };
        });

        extnds.push(result);
        return {
            description: options.description,
            allOf: extnds
        };
    },
    Propertie: function(type, items){
        var result = {
            type: module.exports.getType(type),
            format: module.exports.getFormat(type)
        };

        if(type === 'ARRAY'){
            var isUndefined = typeof items === 'undefined',
                isString = typeof items === 'string';

            result.items = isUndefined ? {type: module.exports.getType('INTEGER')} : ( isString ? { '$ref': '#/definitions/'+ items } : {type: module.exports.getType(items.key)} );
        }

        return result;
    },
    Tag: function(name, options){
        options = options || {};
        var result = {};

        result.name = name;
        result.description = options.description || 'Operations about this resource.';
        result.externalDocs = options.externalDocs || {};

        return result;
    },
    Operation: function(method, service, defaults) {
        defaults = defaults || {};
        // Find is available
        var operation = service.docs[method] || {};
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
    },
    getType: function(type){
        switch(type){
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
    },
    getFormat: function(type){
        switch(type){
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
};
