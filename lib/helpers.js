const _ = require('lodash');

const keyWithArrayLogic = /(.+)\[(?:([+-])?|([+-])\d+)]$/;

const unset = (object, path) => {
  const pathArray = _.toPath(path);
  const leavePath = pathArray.pop();

  // remove from array
  if (pathArray.length) {
    const parent = _.get(object, pathArray);
    if (_.isArray(parent)) {
      return _.pullAt(parent, leavePath);
    }
  }

  return _.unset(object, path);
};

exports.assignWithSet = (object, ...sources) => {
  while (sources.length) {
    const source = _.cloneDeep(sources.shift());
    Object.entries(source).forEach(([key, value]) => {
      if (value === undefined) {
        return unset(object, key);
      }
      const regExpResult = keyWithArrayLogic.exec(key);

      if (regExpResult === null) {
        return _.set(object, key, value);
      }

      const keyWithoutArrayLogic = regExpResult[1];
      if (regExpResult[2] === '-' || regExpResult[3] === '-') {
        // unshift
        const array = _.get(object, keyWithoutArrayLogic);
        _.set(object, keyWithoutArrayLogic, array ? [value, ...array] : [value]);
      } else {
        // push
        const array = _.get(object, keyWithoutArrayLogic);
        _.set(object, `${keyWithoutArrayLogic}[${array ? array.length : 0}]`, value);
      }
    });
  }
  return object;
};

exports.isPaginationEnabled = function (service) {
  return service.options && service.options.paginate && service.options.paginate.default;
};

exports.checkImport = function checkImport (packageName, child) {
  try {
    const rest = require(packageName);
    /* __istanbul ignore else: for @feathers/express versions < 4 */
    if (rest[child]) {
      return true;
    }
  } catch (e) {}
  /* __istanbul ignore next: for @feathers/express versions < 4 */
  return false;
};

exports.requireOrFail = function (packageName, reason = '') {
  let result;
  try {
    result = require(packageName);
  } catch (e) {
    throw new Error(`Package ${packageName} has to be installed ${reason}`);
  }
  return result;
};

exports.isKoaApp = function (app) {
  return typeof app.request === 'object' && typeof app.request.query === 'object';
};

exports.isExpressApp = function (app) {
  return typeof app.request === 'object' && typeof app.request.app === 'function';
};

exports.versionCompare = (v1, v2) => v1.localeCompare(v2, undefined, { numeric: true, sensitivity: 'base' });
