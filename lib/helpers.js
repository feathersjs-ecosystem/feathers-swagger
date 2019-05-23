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
    const source = sources.shift();
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
