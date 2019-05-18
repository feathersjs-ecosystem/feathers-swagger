const { expect } = require('chai');
const { assignWithSet } = require('../lib/helpers');

describe('helper tests', () => {
  describe('assignWithSet', () => {
    it('works with multiple sources', () => {
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

    it('can unset object paths', () => {
      const object = {
        a: {
          b: '1',
          c: '2'
        }
      };

      const source = {
        'a.b': undefined
      };

      const expectedResult = {
        a: {
          c: '2'
        }
      };

      const result = assignWithSet(object, source);

      expect(result).to.equal(object);
      expect(result).to.deep.equal(expectedResult);
    });

    it('can unset array paths', () => {
      const object = {
        a: [
          '1',
          '2',
          '3'
        ]
      };

      const source = {
        'a[1]': undefined
      };

      const expectedResult = {
        a: [
          '1',
          '3'
        ]
      };

      const result = assignWithSet(object, source);

      expect(result).to.equal(object);
      expect(result).to.deep.equal(expectedResult);
    });

    it('can push to arrays', () => {
      const object = {
        a: [
          '1',
          '2',
          '3'
        ]
      };

      const source = {
        'a[]': '4',
        'a[+]': '5',
        'a[+1]': '6',
        'a[+2]': '7'
      };

      const expectedResult = {
        a: [
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          '7'
        ]
      };

      const result = assignWithSet(object, source);

      expect(result).to.equal(object);
      expect(result).to.deep.equal(expectedResult);
    });

    it('can unshift to arrays', () => {
      const object = {
        a: [
          '4',
          '5'
        ]
      };

      const source = {
        'a[-]': '3',
        'a[-1]': '2',
        'a[-2]': '1'
      };

      const expectedResult = {
        a: [
          '1',
          '2',
          '3',
          '4',
          '5'
        ]
      };

      const result = assignWithSet(object, source);

      expect(result).to.equal(object);
      expect(result).to.deep.equal(expectedResult);
    });
  });
});
