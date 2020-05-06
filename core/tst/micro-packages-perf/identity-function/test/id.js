var test = require('tape')
var id = require('../')

test('id', function (t) {
	for (let x=0; x<1000000; x++){
  t.equal(id(3), 3)}
  t.end()
})
