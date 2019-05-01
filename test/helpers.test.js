const { expect } = require('chai');
const { assignWithSet } = require('../lib/helpers');

describe('helper tests', () => {
  it('assignWithSet', () => {
    const object = {
      a: 1,
      b: {
        complete: 'replacement'
      },
      c: {
        partial: 'replacement',
        of: 'subkey',
        remove: 'please'
      },
      d: ['also', 'for', 'arrays'],
      e: 'untouched',
      f: 'to be removed'
    };
    const source = {
      a: 2,
      b: { now: 'different' },
      'c.of': 'subkey replaced',
      'c.added': 'subkey added',
      'c.remove': undefined,
      'd[2]': 'Arrays',
      'd[3].test': 'nested object value',
      'g[]': 'appended to new'
    };
    const source2 = {
      'd[3].test': 'second is the winner',
      'd[3].test2': 'nested object value',
      'd[]': 'appended to existing',
      f: undefined,
      'd[-]': 'prepended'
    };
    const expectedResult = {
      a: 2,
      b: {
        now: 'different'
      },
      c: {
        partial: 'replacement',
        of: 'subkey replaced',
        added: 'subkey added'
      },
      d: ['prepended', 'also', 'for', 'Arrays', { test: 'second is the winner', test2: 'nested object value' }, 'appended to existing'],
      e: 'untouched',
      g: ['appended to new']
    };

    const result = assignWithSet(object, source, source2);

    expect(result).to.equal(object);
    expect(result).to.deep.equal(expectedResult);
  });
});
