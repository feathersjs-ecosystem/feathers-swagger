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
		if (rootDoc.info) {
			rootDoc.info.description += `

## Searching
Searching can be applied to any _get_ endpoint. Also if the id is null searching will work for _update_, _patch_, and _delete_.
**Any field** of the model can be used as a search parameter.

The simplest method is direct equality (ex \`?field=value\`)

Operators can be used by placing them in brackets (ex \`?field[$lt]=6\`)

<details><summary>All Operators</summary>

 * **$eq**: Equal - the same as no operator
 * **$ne**: Not equal
 * **$gte**: Greater than or equal
 * **$gt**: Greater than
 * **$lte**: Less than or equal
 * **$lt**: Less than
 * **$not**: Used to negate querys (ex \`?$not[field][$lt]=7\`)
 * **$in**: Specifies a potential list (ex \`?field[$in]=value1&field[$in]value2\`)
 * **$notIn**: specitifes a list that will not be returned
 * **$like**: Uses SQL's like operator (ex \`?field[$like]=%te_t%\`)
 * **$notLike**: Negated Like
 * **$iLike**: Case Insensitive Like
 * **$notILike**: Case Insensitive Negated Like
 * **$regexp**: Regular Expression - Returns results that match then given expression
 * **$notRegexp**: Omits results that match the given regular expression
 * **$iRegexp**: Case insensitive regular expression
 * **$notIRegexp**: Case insensitive negated regular expression
 * **$between**: Finds values between the given _inclusive_ values (ex \`?field[$between]=value1&field[$between]=value2\`)
 * **$notBetween**: Negated between
 * **$and**: Used to join querys (ex \`?$and[field1]=value1&$and[field2]=value2\`)
 * **$or**: Used to join querys (ex \`?$or[field]=value1&$or[field]=value2\`)
 * **$any**: Can be used with another operator to specify a list of comparisons (see Postgres Any) (ex \`?field[$like][$any]=A%&field[$like][$any]=B%\`)
 * **$all**: Similar to any, but the field must match all of the values (ex \`?field[$like][$all]=A%&field[$like][$all]=%Z\`)
 * **$col**: Used to compare one column against another (ex \`?field1[$gt][$col]=field2\`)

</details>
`
		}

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