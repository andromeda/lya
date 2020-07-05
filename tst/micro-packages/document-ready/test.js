'use strict'

var test = require('tape')
var EventTarget = require('dom-event-target')
var vm = require('vm')
var browserify = require('browserify')

test('node', function (t) {
  t.doesNotThrow(function () {
    require('./')
  }, 'can be required')

  t.throws(function () {
    require('./')()
  }, /browser/, 'throws when called')

  t.end()
})

