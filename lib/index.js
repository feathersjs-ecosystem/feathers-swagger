/*
 * feathers-swagger
 *
 * Copyright (c) 2014 Glavin Wiechert
 * Licensed under the MIT license.
 */

'use strict';

const utils = require('./utils');

module.exports = function (config) {
    return function () {
        var app = this;

        // Enable the swagger Plugin
        app.enable('feathers swagger');

        // Apply configuration
        var rootDoc = Object.assign({
            paths: {},
            definitions: {},
            swagger: '2.0',
            schemes: ['http'],
            tags: [],
            basePath: '',
            docsPath: '/docs',
            consumes: ['application/json'],
            produces: ['application/json'],
            info: {},
            ignore: {
                tags: []
            }
        }, config || {});

        var docsPath = rootDoc.docsPath;

        // Create API for Documentation
        app.get(docsPath, function (req, res) {
            res.json(rootDoc);
        });

        app.docs = rootDoc;

        // Optional: Register this plugin as a Feathers provider
        app.providers.push(function (path, service) {
            service.docs = service.docs || {};
            // Load documentation from service, if available.
            var doc = service.docs,
                group = path.split('/'),
                tag = path.indexOf('/') > -1 ? group[0] : path,
                model = path.indexOf('/') > -1 ? group[1] : path,
                security = {};

            security[rootDoc.security.name] = [];

            if(rootDoc.ignore.tags.indexOf(tag) > -1){
                return;
            }
            var pathObj = rootDoc.paths,
                withIdKey = '/'+path+'/{resourceId}',
                withoutIdKey = '/'+path,
                securities = doc.securities || [];

            if(typeof pathObj[withoutIdKey] === 'undefined'){ pathObj[withoutIdKey] = {}; }
            if(typeof pathObj[withIdKey] === 'undefined'){ pathObj[withIdKey] = {}; }

            if(typeof doc.definition !== 'undefined'){
                rootDoc.definitions[tag] = doc.definition;
            }
            if(typeof doc.definitions !== 'undefined'){
                rootDoc.definitions = Object.assign(rootDoc.definitions, doc.definitions);
            }

            // FIND
            if (typeof service.find === 'function') {
                pathObj[withoutIdKey].get = new utils.Operation('find', service, {
                    tags: [tag],
                    description: 'Retrieves a list of all resources from the service.',
                    produces: rootDoc.produces,
                    consumes: rootDoc.consumes,
                    security: securities.indexOf('find') > -1 ? security : {},
                });
            }
            // GET
            if (typeof service.get === 'function') {
                pathObj[withIdKey].get = new utils.Operation('get', service, {
                    tags: [tag],
                    description: 'Retrieves a single resource with the given id from the service.',
                    parameters: [{
                        description: 'ID of '+model+' to return',
                        in: 'path',
                        required: true,
                        name: 'resourceId',
                        type: 'integer'
                    }],
                    responses: {
                        '200': {
                            description: 'successful utils.operation',
                            schema: {
                                '$ref': '#/definitions/'+model
                            }
                        }
                    },
                    produces: rootDoc.produces,
                    consumes: rootDoc.consumes,
                    security: securities.indexOf('get') > -1 ? security : {}
                });
            }
            // CREATE
            if (typeof service.create === 'function') {
                pathObj[withoutIdKey].post = new utils.Operation('create', service, {
                    tags: [tag],
                    description: 'Creates a new resource with data.',
                    parameters: [{
                        in: 'body',
                        name: 'body',
                        required: true,
                        schema: {'$ref':'#/definitions/'+model}
                    }],
                    produces: rootDoc.produces,
                    consumes: rootDoc.consumes,
                    security: securities.indexOf('create') > -1 ? security : {}
                });
            }
            // UPDATE
            if (typeof service.update === 'function') {
                pathObj[withIdKey].put = new utils.Operation('update', service, {
                    tags: [tag],
                    description: 'Updates the resource identified by id using data.',
                    parameters: [{
                        description: 'ID of '+model+' to return',
                        in: 'path',
                        required: true,
                        name: 'resourceId',
                        type: 'integer'
                    },{
                        in: 'body',
                        name: 'body',
                        required: true,
                        schema: {'$ref':'#/definitions/'+model}
                    }],
                    produces: rootDoc.produces,
                    consumes: rootDoc.consumes,
                    security: securities.indexOf('update') > -1 ? security : {}
                });
            }
            // PATCH
            if (typeof service.patch === 'function') {
                pathObj[withIdKey].patch = new utils.Operation('patch', service, {
                    tags: [tag],
                    description: 'Updates the resource identified by id using data.',
                    parameters: [{
                        description: 'ID of '+model+' to return',
                        in: 'path',
                        required: true,
                        name: 'resourceId',
                        type: 'integer'
                    },{
                        in: 'body',
                        name: 'body',
                        required: true,
                        schema: {'$ref':'#/definitions/'+model}
                    }],
                    produces: rootDoc.produces,
                    consumes: rootDoc.consumes,
                    security: securities.indexOf('patch') > -1 ? security : {}
                });
            }
            // REMOVE
            if (typeof service.remove === 'function') {
                pathObj[withIdKey].delete = new utils.Operation('remove', service, {
                    tags: [tag],
                    description: 'Removes the resource with id.',
                    parameters: [{
                        description: 'ID of '+model+' to return',
                        in: 'path',
                        required: true,
                        name: 'resourceId',
                        type: 'integer'
                    }],
                    produces: rootDoc.produces,
                    consumes: rootDoc.consumes,
                    security: securities.indexOf('remove') > -1 ? security : {}
                });
            }

            rootDoc.paths = pathObj;
            if(!rootDoc.tags.find(function(item){ return item.name === tag; })){
                rootDoc.tags.push(new utils.Tag(tag, doc));
            }
        });

    };
};

module.exports.utils = utils;