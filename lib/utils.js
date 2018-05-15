exports.getType = function getType (type) {
	switch (type) {
		case 'STRING':
		case 'CHAR':
		case 'TEXT':
		case 'BLOB':
		case 'DATE':
		case 'DATEONLY':
		case 'TIME':
		case 'NOW':
			return 'string'
		case 'INTEGER':
		case 'BIGINT':
			return 'integer'
		case 'FLOAT':
		case 'DOUBLE':
		case 'DECIMAL':
			return 'number'
		case 'BOOLEAN':
			return 'boolean'
		case 'ARRAY':
			return 'array'
		default:
			return ''
	}
}

exports.getFormat = function getFormat (type) {
	switch (type) {
		case 'INTEGER':
		case 'DECIMAL':
			return 'int32'
		case 'BIGINT':
			return 'int64'
		case 'FLOAT':
			return 'float'
		case 'DOUBLE':
			return 'double'
		case 'DATE':
		case 'DATEONLY':
			return 'date'
		case 'TIME':
		case 'NOW':
			return 'date-time'
		default:
			return ''
	}
}

exports.property = function property (type, items) {
	const result = {
		type: exports.getType(type),
		format: exports.getFormat(type)
	}

	if (type === 'ARRAY') {
		const isUndefined = typeof items === 'undefined'
		const isString = typeof items === 'string'

		if (isUndefined) {
			result.items = { type: exports.getType('INTEGER') }
		} else if (isString) {
			result.items = { '$ref': '#/definitions/' + items }
		} else {
			result.items = { type: exports.getType(items.key) }
		}
	}

	return result
}

exports.definition = function definition (model, options = { type: 'object' }) {
	const result = {
		type: options.type,
		properties: {}
	}
	const keys = typeof model.attributes !== 'undefined' ? Object.keys(model.attributes) : []

	keys.forEach(function (attrName) {
		const attr = model.attributes[attrName]
		const attrType = typeof attr.key !== 'undefined' ? attr.key : attr.type.constructor.prototype.key
		const prop = exports.property(attrType, model.attributes[attrName].type)

		result.properties[attrName] = prop
	})

	const allOf = (options.extends || []).map(item => {
		return {
			'$ref': '#definitions/' + item
		}
	})

	allOf.push(result)

	return {
		description: options.description,
		allOf
	}
}

exports.tag = function tag (name, options = {}) {
	const tag = {
		name,
		description: options.description || `A ${name} service`
	}
	if (options.externalDocs) {
		tag.externalDocs = options.externalDocs
	}
	return tag
}

exports.operation = function operation (method, service, defaults = {}) {
	const operation = Object.assign(service.docs[method] || {}, service[method].docs || {})

	operation.parameters = operation.parameters || defaults.parameters || []
	operation.responses = operation.responses || defaults.responses || {}
	operation.description = operation.description || defaults.description || ''
	operation.summary = operation.summary || defaults.summary || ''
	operation.tags = operation.tags || defaults.tags || []
	operation.consumes = operation.consumes || defaults.consumes || []
	operation.produces = operation.produces || defaults.produces || []
	operation.security = operation.security || defaults.security || []
	// Clean up
	delete service.docs[method] // Remove `find` from `docs`

	return operation
}


exports.generateDefinitions = function(options) {
	var definitions = {}
	definitions[options.name] =_getDefinitionFromModel(options.Model)
	var arrayDefinition = {
		type: 'array',
		items: {
			$ref: "#/definitions/" + options.name
		}
	}
	if (options.paginate) {
		definitions[options.name + 'List'] = {
			type: 'object',
			properties: {
				total: {
					type: 'integer'
				},
				limit: {
					type: 'integer'
				},
				skip: {
					type: 'integer'
				},
				data: arrayDefinition
			}
		}
	} else {
		definitions[options.name + 'List'] = arrayDefinition
	}
	return definitions
}

exports.getAssociationList = function(model) {
	if (!model) { return [] }
	return Object.keys(model.associations).map((key) => `[${key}](#model-${model.associations[key].target.name})`)
}


// Private methods
function _getDefinitionFromModel(model) {
	let properties = {}
	let required = []
	let example = {}

	for (let key in model.attributes) {
		if (model.attributes.hasOwnProperty(key)) {
			let attr = model.attributes[key]

			properties[key] = _getPropertyFromModelType(attr)

			if (!attr.allowNull && !attr.autoIncrement && !attr.defaultValue) {
				required.push(key)
			}

			example[key] = _getExampleValueFromModelType(attr)
		}
	}

	for(let key in model.associations) {
		properties[key] = _getPropertyFromAssociation(model.associations[key])
	}


	if (!required.length) {
		//For some reason swagger doesn't like empty arrays.
		required = undefined
	}

	return {
		type: 'object',
		required,
		properties,
		example
	}
}

function _getPropertyFromAssociation(association) {
	switch(association.associationType) {
		case 'HasMany':
			return {
				type: 'array',
				items: {
					$ref: "#/definitions/" + association.target.name
				}
			}
		case 'BelongsTo':
		case 'HasOne':
			return {
				$ref: "#/definitions/" + association.target.name
			}
	}
}

function _getPropertyFromModelType(attr) {
	let type = attr.type.constructor.name.toLowerCase()
	let format
	switch (type) {
		case 'date':
		case 'time':
		case 'uuidv4':
		case 'text':
			format = type
			type = 'string'
			break
		case 'double':
			format = type
			type = 'number'
			break
	}
	return {
		type,
		format,
		desc: attr.description
	}
}

function _getExampleValueFromModelType(attr) {
	let type = attr.type.constructor.name.toLowerCase()
	switch (type) {
		case 'date':
			return new Date()
		case 'time':
			return '08:25:23'
		case 'uuidv4':
			return '02f9cac9-4976-4ec7-bb0c-02fb2309745d'
		case 'double':
			return '1.23'
		case 'boolean':
			return 'true'
		case 'integer':
			return '1'
	}
	return type
}