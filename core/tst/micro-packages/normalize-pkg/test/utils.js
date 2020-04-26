'use strict';

require('mocha');
const assert = require('assert');
const utils = require('../lib/utils');

describe('utils', () => {
  describe('.arrayify', () => {
    it('should cast a value to an array', () => {
      assert.deepEqual(utils.arrayify(['foo']), ['foo']);
      assert.deepEqual(utils.arrayify('foo'), ['foo']);
      assert.deepEqual(utils.arrayify(), []);
    });
  });
});

