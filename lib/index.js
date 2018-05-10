const path = require('path');
const url = require('url');
const serveStatic = require('serve-static');
const utils = require('./utils');
const pick = require('lodash.pick');
const configurePlugin = require('./configure-plugin');
const config = require('./config');

// Find node_modules root path
let modulesRootPath = require.resolve('swagger-ui-dist');
modulesRootPath = modulesRootPath.substr(0, modulesRootPath.lastIndexOf('node_modules'));

module.exports = function (initConfig) {
	config(initConfig);
	return function () {
		const app = this;

		// Whitelist root level properties in Swagger 2.0 spec
		// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md
		const swaggerWhitelist = [
			'swagger', // required
			'info', // required
			'host',
			'basePath',
			'schemes',
			'consumes',
			'produces',
			'paths', // required
			'definitions',
			'parameters',
			'responses',
			'securityDefinitions',
			'security',
			'tags',
			'externalDocs'
		];

		const whitelistConfig = pick(config, swaggerWhitelist);

		// Apply configuration with whitelist
		const rootDoc = Object.assign({
			swagger: '2.0',
			info: {},
			paths: {},
			basePath: '/',
			schemes: [],
			consumes: [],
			produces: [],
			definitions: {},
			parameters: {},
			responses: {},
			securityDefinitions: {},
			security: [],
			tags: []
		}, whitelistConfig || {});

		const docsPath = config.docsPath || '/docs';

		// Create API for Documentation
		app.get(docsPath, function (req, res) {
			res.format({
				'application/json': function () {
					res.json(rootDoc);
				},

				'text/html': function () {
					const parsed = url.parse(req.url);
					const pathname = parsed.pathname;

					if (pathname[pathname.length - 1] !== '/') {
						parsed.pathname = `${req.baseUrl}${pathname}/`;
						return res.redirect(301, url.format(parsed));
					}

					if (typeof config.uiIndex === 'function') {
						config.uiIndex(req, res);
					} else if (typeof config.uiIndex === 'string') {
						res.sendFile(config.uiIndex);
					} else if (config.uiIndex === true) {
						if (req.query.url) {
							res.sendFile(path.join(modulesRootPath, 'node_modules/swagger-ui-dist/index.html'));
						} else {
							// Set swagger url (needed for default UI)
							res.redirect('?url=' + encodeURI(config.docsPath));
						}
					} else {
						res.json(rootDoc);
					}
				}
			});
		});

		if (typeof config.uiIndex !== 'undefined') {
			const uiPath = path.dirname(require.resolve('swagger-ui-dist'));
			console.log('Adding static path', uiPath);
			app.use(docsPath, serveStatic(uiPath));
		}

		app.docs = rootDoc;

		// Add steps to app.setup
		const oldSetup = app.setup

		app.setup = function (...args) {
			const result = oldSetup.apply(this, args)
			const app = this

			Object.keys(app.services).forEach(path => {
				configurePlugin.apply(this, [app.service(path), path])
			})

			if(initConfig.afterSetup) {
				initConfig.afterSetup()
			}

			return result
		}

		// Optional: Register this plugin as a Feathers provider
		// if (app.version && parseInt(app.version, 10) >= 3) {
		// 	app.mixins.push(configurePlugin);
		// } else {
		// 	app.providers.push((path, service) => configurePlugin(service, path));
		// }
	};
};