/*
 * feathers-swagger
 *
 * Copyright (c) 2014 Glavin Wiechert
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(config) {
    return function() {
        var app = this;
        var services = {};

        var docs = { };

        // Enable the swagger Plugin
        app.enable('feathers swagger');

        // Check for configuration
        if (config) {
            // Apply configuration
            var path = config.path || '/docs';
            // Setup docs from config
            docs.apiVersion = config.version || '0.0.0';
            docs.swaggerVersion = config.swaggerVersion || '1.2';
            docs.info = config.info || {};
            docs.apis = config.apis || [];
            docs.models = config.models || {};
            docs.basePath = config.basePath || '/';
            docs.resourcePath = config.resourcePath || '/';

            app.get(path, function(req, res) {
                //console.log(docs);
                res.json(docs);
            });
        }

        // Optional: Register this plugin as a Feathers provider
        app.providers.push(function(path, service) {
            console.log(path, service);
            services[path] = service;
            
            var api = {
                path: '/'+path,
                description: path,
                operations: []
            };

            // FIND
            if (typeof service.find === 'function')
            {
                // Find is available
                var findOperation = {
                    method: 'GET',
                    nickname: 'GET '+path,
                    type: 'Array',
                    parameters: [],
                    summary: 'Find all items of this type.',
                    notes: 'These are notes',
                    errorResponses: []
                };
                api.operations.push(findOperation);
            }
            // GET
            if (typeof service.get === 'function')
            {
                // Find is available
                var getOperation = {
                    method: 'GET',
                    nickname: 'GET '+path,
                    type: 'Object',
                    parameters: [],
                    summary: 'Find single item of this type with ID.',
                    notes: 'These are notes',
                    errorResponses: []
                };
                api.operations.push(getOperation);
            }
            // CREATE
            if (typeof service.create === 'function')
            {
                // Find is available
                var createOperation = {
                    method: 'POST',
                    nickname: 'GET '+path,
                    type: 'Object',
                    parameters: [],
                    summary: 'Create an item of this type.',
                    notes: 'These are notes',
                    errorResponses: []
                };
                api.operations.push(createOperation);
            }
            // UPDATE
            if (typeof service.update === 'function')
            {
                // Find is available
                var updateOperation = {
                    method: 'PUT',
                    nickname: 'GET '+path,
                    type: 'Object',
                    parameters: [],
                    summary: 'Update an item of this type.',
                    notes: 'These are notes',
                    errorResponses: []
                };
                api.operations.push(updateOperation);
            }
            // REMOVE
            if (typeof service.remove === 'function')
            {
                // Find is available
                var removeOperation = {
                    method: 'DELETE',
                    nickname: 'GET '+path,
                    type: 'Object',
                    parameters: [],
                    summary: 'Delete an item of this type.',
                    notes: 'These are notes',
                    errorResponses: []
                };
                api.operations.push(removeOperation);
            }

            docs.apis.push(api);

            console.log(docs);
        });

    };
};
