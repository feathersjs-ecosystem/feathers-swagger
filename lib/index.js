
const utils = require('./utils');
const swaggerUI = require('./swagger-ui-dist');
const { customMethod, customMethodsHandler } = require('./custom-methods');
const init = require('./init');

const feathersSwagger = module.exports = init.bind({});

Object.assign(feathersSwagger, utils);
feathersSwagger.swaggerUI = swaggerUI;
feathersSwagger.customMethod = customMethod;
feathersSwagger.customMethodsHandler = customMethodsHandler;
