const _ = require('lodash');

const keyWithArrayLogic = /(.+)\[(?:([+-])?|([+-])\d+)]$/;

exports.assignWithSet = (object, ...sources) => {
  while (sources.length) {
    let source = sources.shift();
    Object.entries(source).forEach(([key, value]) => {
      if (value === undefined) {
        return _.unset(object, key);
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
