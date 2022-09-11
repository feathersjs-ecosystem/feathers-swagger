/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const { customMethod } = require('../lib');
const { isFeathers4 } = require('./helper');

const isCustomMethod = (() => {
  if (isFeathers4) {
    const { HTTP_METHOD } = require('@feathersjs/express/rest');

    return (method) => method[HTTP_METHOD] !== undefined;
  }

  const { CUSTOM_METHOD } = require('../lib/custom-methods');

  return (method) => method[CUSTOM_METHOD] !== undefined;
})();

describe('customMethod', () => {
  it('should work as wrapper function', () => {
    const fn = () => {};
    const result = customMethod('POST', '/path')(fn);
    expect(result).to.eq(fn);
    expect(isCustomMethod(result)).to.be.true;
  });

  it('should work as typescript decorator', () => {
    const service = {
      custom: () => {}
    };

    expect(customMethod('POST', '/path')(service, 'custom', {})).to.not.exist;
    expect(isCustomMethod(service.custom)).to.be.true;
  });
});
