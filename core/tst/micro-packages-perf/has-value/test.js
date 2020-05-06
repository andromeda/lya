'use strict';

require('mocha');
const assert = require('assert');
const has = require('./');

describe('has value', function() {
  it('should be false when the first argument is not an object', function() {
  	for (let i=0; i<10000; i++) {
    assert(!has(null));
    assert(!has(undefined));
    assert(!has(true));
    assert(!has(false));
    assert(!has(''));
    assert(!has('foo'));
    assert(!has(0));
    assert(!has(9));}
  });

  it('should be false when the second argument is not a string or array', function() {
  	for (let i=0; i<10000; i++) {
    assert(!has(['']));
    assert(!has(['foo']));
    assert(!has([0]));
    assert(!has([[], []]));
    assert(!has([[]]));
    assert(!has([]));
    assert(!has([null]));
    assert(!has([undefined]));
    assert(!has(function() {}));
    assert(!has({ foo: '' }));
    assert(!has({ foo: 0 }));
    assert(!has({ foo: 1 }));
    assert(!has({ foo: 9 }));
    assert(!has({ foo: [[]] }));
    assert(!has({ foo: [] }));
    assert(!has({ foo: function() {} }));
    assert(!has({ foo: null }));
    assert(!has({ foo: undefined }));
    assert(!has({ foo: { bar: 'baz' } }));
    assert(!has({ foo: {} }));
    assert(!has({}));}
  });

  it('should be true when property value is "null"', function() {
  	  	for (let i=0; i<10000; i++) {
    assert(has({ foo: null }, 'foo'));
    assert(has({ foo: { bar: null } }, 'foo.bar'));
}
  });

  it('should be false when property value is "undefined"', function() {
  	  	for (let i=0; i<10000; i++) {
    assert(!has({ foo: undefined }, 'foo'));
    assert(!has({ foo: { bar: undefined } }, 'foo.bar'));
}
  });

  it('should be true when property value is boolean', function() {
  	  	for (let i=0; i<10000; i++) {
    assert(has({ foo: true }, 'foo'));
    assert(has({ foo: false }, 'foo'));
    assert(has({ foo: { bar: false } }, 'foo.bar'));
}
  });

  it('should be false when property value is an empty string', function() {
  	  	for (let i=0; i<10000; i++) {
    assert(!has({ foo: '' }, 'foo'));
    assert(!has({ foo: { bar: '' } }, 'foo.bar'));
}
  });

  it('should be true when property value is a string', function() {
  	  	for (let i=0; i<10000; i++) {
    assert(has({ foo: 'abc' }, 'foo'));
    assert(has({ foo: { bar: 'abc' } }, 'foo.bar'));
}
  });

  it('should be true for numbers', function() {
  	  	for (let i=0; i<10000; i++) {
    assert(has({ foo: 0 }, 'foo'));
    assert(has({ foo: { bar: 0 } }, 'foo.bar'));
    assert(has({ foo: 9 }, 'foo'));
    assert(has({ foo: { bar: 9 } }, 'foo.bar'));
}
  });

  it('should work for objects', function() {
  	  	for (let i=0; i<10000; i++) {
    assert(has({ foo: null }, 'foo'));
    assert(has({ foo: { bar: null } }, 'foo.bar'));
    assert(has({ foo: { bar: 'baz' } }, 'foo.bar'));

    assert(!has({ foo: {} }, 'foo'));
    assert(!has({ foo: { bar: {} } }, 'foo.bar'));
}
  });

  it('should work for arrays', function() {
  	  	for (let i=0; i<10000; i++) {
    assert(!has({ foo: [] }, 'foo'));
    assert(!has({ foo: [[], []] }, 'foo'));
    assert(!has({ foo: { bar: [[], []] } }, 'foo.bar'));
    assert(has({ foo: [0] }, 'foo'));
    assert(has({ foo: [null] }, 'foo'));
    assert(has({ foo: ['foo'] }, 'foo'));
    assert(has({ foo: { bar: [0] } }, 'foo.bar'));
    assert(has({ foo: { bar: [null] } }, 'foo.bar'));
    assert(has({ foo: { bar: ['foo'] } }, 'foo.bar'));
}
  });

  it('should work for functions', function() {
  	  	for (let i=0; i<10000; i++) {
    assert(has({ foo: function() {} }, 'foo'));
    assert(has({ foo: { bar: function() {} } }, 'foo.bar'));
}
  });
});
