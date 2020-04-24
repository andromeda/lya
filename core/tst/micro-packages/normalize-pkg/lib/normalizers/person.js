'use strict';

const utils = require('../utils');
const merge = require('../merge');

/**
 * Stringify a person object, or array of person objects, such as
 * `maintainer`, `collaborator`, `contributor`, and `author`.
 *
 * @param {Object|Array|String} `val` If an object is passed, it will be converted to a string. If an array of objects is passed, it will be converted to an array of strings.
 * @return {String}
 * @api public
 */

module.exports = function person(val, key, config, schema) {
  merge(config, schema);

  if (Array.isArray(val)) {
    val = val.map(str => person(str, key, config, schema));
  }

  if (utils.isObject(val)) {
    val = utils.stringify(val);
  }

  return val;
};
