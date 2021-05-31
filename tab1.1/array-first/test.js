/*!
 * array-first <https://github.com/jonschlinkert/array-first>
 *
 * Copyright (c) 2014-2016 Jon Schlinkert.
 * Licensed under the MIT License
 */

'use strict';

var should = require('should');
var first = require('./');

describe('first', function() {
  it('should throw an error if the value passed is not an array:', function() {
    (function() {
      first();
    }).should.throw('array-first expects an array as the first argument.');
  });

  it('should return the first element in the array:', function() {
    first(['a', 'b', 'c', 'd', 'e', 'f']).should.eql('a');
    first(['a', 'b', 'c', 'd', 'e', 'f'], 1).should.eql('a');
  });

  it('should the first n elements of the array:', function() {
    first(['a', 'b', 'c', 'd', 'e', 'f'], 3).should.eql(['a', 'b', 'c']);
  });
});

