process.env.NODE_ENV = 'test';

var assert = require('assert');

var leftPad = require('../index');

describe('utils/leftPad', function(){
  it('# leftPad(s, size)', function(){
    assert.deepEqual(leftPad('1110101', 10), '   1110101');
    assert.deepEqual(leftPad('1010101', 8), ' 1010101');
    assert.deepEqual(leftPad('1010101', 7), '1010101');
    assert.deepEqual(leftPad('1010101', 6), '1010101');
  });

  it('# leftPad(s, size, ch)', function(){
    assert.deepEqual(leftPad('1110101', 10, '0'), '0001110101');
    assert.deepEqual(leftPad('1010101', 8, '0'), '01010101');
    assert.deepEqual(leftPad('1010101', 7, '0'), '1010101');
    assert.deepEqual(leftPad('1010101', 6, '0'), '1010101');
  });
});
