/*jshint -W030 */
'use strict';
var Benchmark = require('benchmark');
var inArray = require('./');

var suite = new Benchmark.Suite();

// add tests
suite.add('inArray', function() {
  inArray(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'], 'z');
})
.add('indexOf', function() {
  (['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'].indexOf('z') > -1);
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log(this.filter('fastest').map('name') + ' is faster');
})
// run async
.run({ 'async': true });
