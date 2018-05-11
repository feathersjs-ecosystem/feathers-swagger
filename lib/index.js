const pick = require('lodash.pick')
const configurePlugin = require('./configure-plugin')


module.exports = function (config) {
	return function () {
		const app = this

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
		]

		const whitelistConfig = pick(config, swaggerWhitelist)

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
		}, whitelistConfig || {})

		const docsPath = config.docsPath || '/docs'

		// Create API for Documentation
		app.get(docsPath, function (req, res) {
			res.format({
				'application/json': function () {
					res.json(rootDoc)
				}
			})
		})

		app.docs = rootDoc

		// Add steps to app.setup
		const oldSetup = app.setup

		app.setup = function (...args) {
			const result = oldSetup.apply(this, args)
			const app = this

			const setupService = configurePlugin(config)

			Object.keys(app.services).forEach(path => {
				setupService.apply(app, [app.service(path), path])
			})

			if(config.afterSetup) {
				config.afterSetup()
			}

			return result
		}

		// Optional: Register this plugin as a Feathers provider
		// if (app.version && parseInt(app.version, 10) >= 3) {
		// 	app.mixins.push(configurePlugin);
		// } else {
		// 	app.providers.push((path, service) => configurePlugin(service, path));
		// }
	}
}