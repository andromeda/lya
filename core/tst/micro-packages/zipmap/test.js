'use strict';

var assert = require('assert');
var zipmap = require('./');

var keys = ['a', 'b', 'c'];
var vals = [1, 2, 3];

describe('zipmap', function() {
  it('zips keys and vals', function() {
    var map = zipmap(keys, vals);
    assert.deepEqual(map, { a: 1, b: 2, c: 3 });
  });

  it('zips with the shorter array', function() {
    var map = zipmap(keys.slice(0,1), vals);
    assert.deepEqual(map, { a: 1 });

    map = zipmap(keys, vals.slice(0, 2));
    assert.deepEqual(map, { a: 1, b: 2 });
  });

  it('zips an array of objects with key/value properties', function() {
    var objs = [
      { key: 'foo', value: 'bar' },
      { key: 'hi', value: 'bye' },
    ];

    var out = {
      foo: 'bar',
      hi: 'bye'
    };

    var map = zipmap(objs);
    assert.deepEqual(map, out);
  });

  it('zips an array of arrays', function() {
    var pairs = [
      ['foo', 'bar'],
      ['hi', 'bye']
    ];

    var out = {
      foo: 'bar',
      hi: 'bye'
    };

    var map = zipmap(pairs);
    assert.deepEqual(map, out);
  });

  it('returns an empty object if empty array supplied', function() {
    assert.deepEqual(zipmap([]), {});
  });

  it('throws a TypeError if not pairs or objs and only supply 1 arg', function() {
    var err;
    try {
      zipmap(1);
    } catch(e) {
      err = e;
    }
    assert(err instanceof TypeError);
  });
  
});
