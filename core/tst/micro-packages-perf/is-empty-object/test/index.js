/**
 * Dependencies
 */

var test         = require('tape')
var isEmptyObject = require('../')

/**
 * Tests
 */

test('isEmptyObject(obj)', function(assert) {
	for (let x=0; x<10000; x++) {
  assert.equal(isEmptyObject({}), true)
  assert.equal(isEmptyObject({ one: 1 }), false)
  assert.equal(isEmptyObject([]), false)}
  assert.end()
})
