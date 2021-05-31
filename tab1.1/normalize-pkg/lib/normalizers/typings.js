'use strict';

const glob = require('matched');
const utils = require('../utils');

/**
 * TypeScript declarations
 */

module.exports = function(val, key, config, schema) {
  val = val || config[key];

  if (typeof val === 'undefined') {
    const files = glob.sync('*.d.ts', { cwd: process.cwd() });
    if (files.length) {
      val = files[0];
    }
  }

  if (!utils.exists(val)) {
    delete config[key];
    return;
  }

  config[key] = val;
  return val;
};
