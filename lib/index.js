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
        var services = {};

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
            info: {}
        }, config || {});

        var docsPath = rootDoc.docsPath;

        // Create API for Documentation
        app.get(docsPath, function (req, res) {
            res.json(rootDoc);
        });

        // Optional: Register this plugin as a Feathers provider
        app.providers.push(function (path, service) {
            services[path] = service;
            service.docs = service.docs || {};
            // Load documentation from service, if available.
            var doc = service.docs;

            // by 2.0
            var pathObj = rootDoc.paths,
                withIdKey = '/'+path+'/{resourceId}',
                withoutIdKey = '/'+path;

            if(typeof pathObj[withoutIdKey] === 'undefined'){ pathObj[withoutIdKey] = {}; }
            if(typeof pathObj[withIdKey] === 'undefined'){ pathObj[withIdKey] = {}; }

            if(typeof doc.definition !== 'undefined'){
                rootDoc.definitions[path] = doc.definition;
            }
            if(typeof doc.definitions !== 'undefined'){
                rootDoc.definitions = Object.assign(rootDoc.definitions, doc.definitions);
            }

            // FIND
            if (typeof service.find === 'function') {
                pathObj[withoutIdKey].get = new utils.Operation('find', service, {
                    tags: [path],
                    description: 'Retrieves a list of all resources from the service.',
                    produces: rootDoc.produces,
                    consumes: rootDoc.consumes
                });
            }
            // GET
            if (typeof service.get === 'function') {
                pathObj[withIdKey].get = new utils.Operation('get', service, {
                    tags: [path],
                    description: 'Retrieves a single resource with the given id from the service.',
                    parameters: [{
                        description: 'ID of '+path+' to return',
                        in: 'path',
                        required: true,
                        name: 'resourceId',
                        type: 'integer'
                    }],
                    responses: {
                        '200': {
                            description: 'successful utils.operation',
                            schema: {
                                '$ref': '#/definitions/'+path
                            }
                        }
                    },
                    produces: rootDoc.produces,
                    consumes: rootDoc.consumes
                });
            }
            // CREATE
            if (typeof service.create === 'function') {
                pathObj[withoutIdKey].post = new utils.Operation('create', service, {
                    tags: [path],
                    description: 'Creates a new resource with data.',
                    parameters: [{
                        in: 'body',
                        name: 'body',
                        required: true,
                        schema: {'$ref':'#/definitions/'+path}
                    }],
                    produces: rootDoc.produces,
                    consumes: rootDoc.consumes
                });
            }
            // UPDATE
            if (typeof service.update === 'function') {
                pathObj[withIdKey].put = new utils.Operation('update', service, {
                    tags: [path],
                    description: 'Updates the resource identified by id using data.',
                    parameters: [{
                        description: 'ID of '+path+' to return',
                        in: 'path',
                        required: true,
                        name: 'resourceId',
                        type: 'integer'
                    },{
                        in: 'body',
                        name: 'body',
                        required: true,
                        schema: {'$ref':'#/definitions/'+path}
                    }],
                    produces: rootDoc.produces,
                    consumes: rootDoc.consumes
                });
            }
            // REMOVE
            if (typeof service.remove === 'function') {
                pathObj[withIdKey].delete = new utils.Operation('remove', service, {
                    tags: [path],
                    description: 'Removes the resource with id.',
                    parameters: [{
                        description: 'ID of '+path+' to return',
                        in: 'path',
                        required: true,
                        name: 'resourceId',
                        type: 'integer'
                    }],
                    produces: rootDoc.produces,
                    consumes: rootDoc.consumes
                });
            }

            rootDoc.paths = pathObj;
            rootDoc.tags.push(new utils.Tag(path, doc));
        });

    };
};

module.exports.utils = utils;