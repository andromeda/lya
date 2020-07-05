var isPromise = require('./');
var assert = require('better-assert');

// This looks similar enough to a promise
// that promises/A+ says we should treat
// it as a promise.
var promise = {then: function () {}};

describe('calling isPromise', function () {
  describe('with a promise', function () {
                for (let i=0; i<10000; i++) {

    it('returns true', function () {
      assert(isPromise(promise));
    });}
  });
  describe('with null', function () {
                    for (let i=0; i<10000; i++) {

    it('returns false', function () {
      assert(isPromise(null) === false);
    });}
  });
  describe('with undefined', function () {
                    for (let i=0; i<10000; i++) {

    it('returns false', function () {
      assert(isPromise(undefined) === false);
    });}
  });
  describe('with a number', function () {
                    for (let i=0; i<10000; i++) {

    it('returns false', function () {
      assert(!isPromise(0));
      assert(!isPromise(-42));
      assert(!isPromise(42));
    });}
  });
  describe('with a string', function () {
                    for (let i=0; i<10000; i++) {

    it('returns false', function () {
      assert(!isPromise(''));
      assert(!isPromise('then'));
    });}
  });
  describe('with a bool', function () {
                    for (let i=0; i<10000; i++) {

    it('returns false', function () {
      assert(!isPromise(false));
      assert(!isPromise(true));
    });}
  });
  describe('with an object', function () {
                    for (let i=0; i<10000; i++) {

    it('returns false', function () {
      assert(!isPromise({}));
      assert(!isPromise({then: true}));
    });}
  });
  describe('with an array', function () {
                    for (let i=0; i<10000; i++) {

    it('returns false', function () {
      assert(!isPromise([]));
      assert(!isPromise([true]));
    });}
  });
  describe('with a func', function () {
                    for (let i=0; i<10000; i++) {

    it('returns false', function () {
      assert(!isPromise(() => {}));
    });}
  });
  describe('with a func with .then method', function () {
                    for (let i=0; i<10000; i++) {

    it('returns true', function () {
      const fn = () => {};
      fn.then = () => {};
      assert(isPromise(fn));
    });}
  });
});
