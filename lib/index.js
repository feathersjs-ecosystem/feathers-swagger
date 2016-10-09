/*
 * feathers-swagger
 *
 * Copyright (c) 2014 Glavin Wiechert
 * Licensed under the MIT license.
 */

'use strict';
var path = require('path');

module.exports = function (config) {
    return function () {
        var app = this;
        var services = {};
        config = config || {};

        // Enable the swagger Plugin
        app.enable('feathers swagger');

        // Apply configuration
        var rootDoc = {};
        var basePath = config.basePath || '/';
        var docsPath = config.docsPath || '/docs';
        var docExt = config.docExt || '';
        docsPath = path.posix.join(basePath, docsPath);
        console.log(docsPath);

        // Setup docs from config
        rootDoc.info = config.info || {};

        // by 2.0
        rootDoc.paths = config.paths || {};
        rootDoc.definitions = config.definitions || {};
        rootDoc.swagger = config.swagger || '2.0';
        rootDoc.schemes = ['http'];
        rootDoc.tags = [];
        rootDoc.basePath = basePath;

        // Create API for Documentation
        app.get(docsPath, function (req, res) {
            res.json(rootDoc);
        });

        // Optional: Register this plugin as a Feathers provider
        app.providers.push(function (path, service) {
            console.log(path, service);
            services[path] = service;
            service.docs = service.docs || {};
            // Load documentation from service, if available.
            var doc = service.docs;

            // by 2.0
            var pathObj = rootDoc.paths || {},
                withIdKey = '/'+path+'/{resourceId}',
                withoutIdKey = '/'+path;

            if(typeof pathObj[withoutIdKey] === 'undefined'){ pathObj[withoutIdKey] = {}; }
            if(typeof pathObj[withIdKey] === 'undefined'){ pathObj[withIdKey] = {}; }

            function Operation2(method, service, defaults) {
                defaults = defaults || {};
                // Find is available
                var operation = service.docs[method] || {};
                operation.parameters = operation.parameters || defaults.parameters || [];
                operation.responses = operation.responses || defaults.responses || [];
                operation.summary = operation.summary || defaults.summary || '';
                operation.tags = operation.tags || defaults.tags || [];
                operation.produces = operation.produces || defaults.produces || [];
                operation.security = operation.security || defaults.security || [];
                operation.securityDefinitions = operation.securityDefinitions || defaults.securityDefinitions || [];
                // Clean up
                delete service.docs[method]; // Remove `find` from `docs`
                return operation;
            }

            // FIND
            if (typeof service.find === 'function') {
                pathObj[withoutIdKey].get = new Operation2('find', service, {
                    tags: [path],
                    description: 'Retrieves a list of all resources from the service.'
                });
            }
            // GET
            if (typeof service.get === 'function') {
                pathObj[withIdKey].get = new Operation2('get', service, {
                    tags: [path],
                    description: 'Retrieves a single resource with the given id from the service.',
                });
            }
            // CREATE
            if (typeof service.create === 'function') {
                pathObj[withIdKey].post = new Operation2('create', service, {
                    tags: [path],
                    description: 'Creates a new resource with data.'
                });
            }
            // UPDATE
            if (typeof service.update === 'function') {
                pathObj[withIdKey].put = new Operation2('update', service, {
                    tags: [path],
                    description: 'Updates the resource identified by id using data.',
                });
            }
            // REMOVE
            if (typeof service.remove === 'function') {
                pathObj[withIdKey].delete = new Operation2('remove', service, {
                    tags: [path],
                    description: 'Removes the resource with id.',
                });
            }

            function Tag(name, options){
                options = options || {};
                var result = {};

                result.name = name;
                result.description = options.description || 'Operations about this resource.';
                result.externalDocs = options.externalDocs || {};

                return result;
            }

            rootDoc.paths = pathObj;
            rootDoc.tags.push(new Tag(path, doc));

            // Create handler for serving the service's documentation
            app.get(docsPath + '/' + path + docExt, function (req, res) {
                res.json(doc);
            });

        });

    };
};
