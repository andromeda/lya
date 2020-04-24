'use strict';

require('mocha');
var assert = require('assert');
var inArray = require('./');

describe('inArray:', function() {
  it('should return true if the value exists in the array.', function() {
    assert(inArray(['a', 'b', 'c', 'c'], 'a'));
  });

  it('should return true if the value exists in the array.', function() {
    assert(!inArray(['a', 'b', 'c', 'c'], 'd'));
  });

  it('should\'nt blow up on empty arrays', function() {
    assert(!inArray([], 'd'));
  });

  it('should\'nt blow up on null', function() {
    assert(!inArray(null, 'd'));
  });

  it('should\'nt blow up when no value is passed', function() {
    assert(!inArray(null));
  });
});
