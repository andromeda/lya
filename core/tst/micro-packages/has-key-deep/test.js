/* eslint-env node, mocha */
/* eslint func-names: 0 */
var assert = require('assert');
var hasKeyDeep = require('./index');

describe('hasKeyDeep()',  function() {
  var testObject = { a: { b: { c: 1 } } };

  context('fully applied', function () {
    context('empty object',  function() {
      it('should return false when query is a string',  function() {
        var result = hasKeyDeep('a.b', {});
        assert(!result, 'result should be false');
      });

      it('should return false when query is an array',  function() {
        var result = hasKeyDeep(['a', 'b'], {});
        assert(!result, 'result should be false');
      });
    });

    context('valid string queries',  function() {
      it('should return true when the key is present (1)',  function() {
        assert(hasKeyDeep('a', testObject));
      });

      it('should return true when the key is present (2)',  function() {
        assert(hasKeyDeep('a.b', testObject));
      });

      it('should return true when the key is present (3)',  function() {
        assert(hasKeyDeep('a.b.c', testObject));
      });

      it('should return true if the value is null',  function() {
        assert(hasKeyDeep('a.b', { a: { b: null } }));
      });

      it('should return true if the value is undefined',  function() {
        assert(hasKeyDeep('a.b', { a: { b: undefined } }));
      });
    });

    context('valid array queries',  function() {
      it('should return true when the key is present (1)',  function() {
        assert(hasKeyDeep(['a'], testObject));
      });

      it('should return true when the key is present (2)',  function() {
        assert(hasKeyDeep(['a', 'b'], testObject));
      });

      it('should return true when the key is present (3)',  function() {
        assert(hasKeyDeep(['a', 'b', 'c'], testObject));
      });

      it('should return true if the value is null',  function() {
        assert(hasKeyDeep(['a', 'b'], { a: { b: null } }));
      });

      it('should return true if the value is undefined',  function() {
        assert(hasKeyDeep(['a', 'b'], { a: { b: undefined } }));
      });
    });

    context('invalid string queries',  function() {
      it('should return false when the key is not present (1)',  function() {
        assert(!hasKeyDeep('a.b.c.d', testObject));
      });

      it('should return false when the key is not present (2)',  function() {
        assert(!hasKeyDeep('a.c', testObject));
      });

      it('should return false when the key is not present (3)',  function() {
        assert(!hasKeyDeep('c', testObject));
      });

      it('should return false when an earlier value is null',  function() {
        assert(!hasKeyDeep('a.b.c', { a: null }));
      });

      it('should return false when an earlier value is undefined',  function() {
        assert(!hasKeyDeep('a.b.c', { a: undefined }));
      });

      it('should return false when the object is undefined', function() {
        assert(!hasKeyDeep('a.b.c', undefined));
      });
    });

    context('invalid array queries',  function() {
      it('should return false when the key is not present (1)',  function() {
        assert(!hasKeyDeep(['a', 'b', 'c', 'd'], testObject));
      });

      it('should return false when the key is not present (2)',  function() {
        assert(!hasKeyDeep(['a', 'c'], testObject));
      });

      it('should return false when the key is not present (3)',  function() {
        assert(!hasKeyDeep(['c'], testObject));
      });

      it('should return false when an earlier value is null',  function() {
        assert(!hasKeyDeep(['a', 'b', 'c'], { a: null }));
      });

      it('should return false when an earlier value is undefined',  function() {
        assert(!hasKeyDeep(['a', 'b', 'c'], { a: undefined }));
      });

      it('should return false when the object is undefined', function() {
        assert(!hasKeyDeep(['a', 'b', 'c'], undefined));
      });
    });
  });

  describe('partially applied', function () {
    context('empty object',  function() {
      it('should return false when query is a string',  function() {
        var result = hasKeyDeep('a.b')({});
        assert(!result, 'result should be false');
      });

      it('should return false when query is an array',  function() {
        var result = hasKeyDeep(['a', 'b'])({});
        assert(!result, 'result should be false');
      });
    });

    context('valid string queries',  function() {
      it('should return true when the key is present (1)',  function() {
        assert(hasKeyDeep('a')(testObject));
      });

      it('should return true when the key is present (2)',  function() {
        assert(hasKeyDeep('a.b')(testObject));
      });

      it('should return true when the key is present (3)',  function() {
        assert(hasKeyDeep('a.b.c')(testObject));
      });

      it('should return true if the value is null',  function() {
        assert(hasKeyDeep('a.b')({ a: { b: null } }));
      });

      it('should return true if the value is undefined',  function() {
        assert(hasKeyDeep('a.b')({ a: { b: undefined } }));
      });
    });

    context('valid array queries',  function() {
      it('should return true when the key is present (1)',  function() {
        assert(hasKeyDeep(['a'])(testObject));
      });

      it('should return true when the key is present (2)',  function() {
        assert(hasKeyDeep(['a', 'b'])(testObject));
      });

      it('should return true when the key is present (3)',  function() {
        assert(hasKeyDeep(['a', 'b', 'c'])(testObject));
      });

      it('should return true if the value is null',  function() {
        assert(hasKeyDeep(['a', 'b'])({ a: { b: null } }));
      });

      it('should return true if the value is undefined',  function() {
        assert(hasKeyDeep(['a', 'b'])({ a: { b: undefined } }));
      });
    });

    context('invalid string queries',  function() {
      it('should return false when the key is not present (1)',  function() {
        assert(!hasKeyDeep('a.b.c.d')(testObject));
      });

      it('should return false when the key is not present (2)',  function() {
        assert(!hasKeyDeep('a.c')(testObject));
      });

      it('should return false when the key is not present (3)',  function() {
        assert(!hasKeyDeep('c')(testObject));
      });

      it('should return false when an earlier value is null',  function() {
        assert(!hasKeyDeep('a.b.c')({ a: null }));
      });

      it('should return false when an earlier value is undefined',  function() {
        assert(!hasKeyDeep('a.b.c')({ a: undefined }));
      });

      it('should return false when the object is undefined', function() {
        assert(!hasKeyDeep('a.b.c')(undefined));
      });
    });

    context('invalid array queries',  function() {
      it('should return false when the key is not present (1)',  function() {
        assert(!hasKeyDeep(['a', 'b', 'c', 'd'])(testObject));
      });

      it('should return false when the key is not present (2)',  function() {
        assert(!hasKeyDeep(['a', 'c'])(testObject));
      });

      it('should return false when the key is not present (3)',  function() {
        assert(!hasKeyDeep(['c'])(testObject));
      });

      it('should return false when an earlier value is null',  function() {
        assert(!hasKeyDeep(['a', 'b', 'c'])({ a: null }));
      });

      it('should return false when an earlier value is undefined',  function() {
        assert(!hasKeyDeep(['a', 'b', 'c'])({ a: undefined }));
      });

      it('should return false when the object is undefined', function() {
        assert(!hasKeyDeep(['a', 'b', 'c'])(undefined));
      });
    });
  });
});

