'use strict';

const { defineProperty } = Reflect;
const fs = require('fs');
const path = require('path');

const define = (obj, key, fn) => {
  defineProperty(obj, key, { get: fn });
};

/**
 * Lazily required module depedencies
 */

define(exports, 'union', () => require('arr-union'));
define(exports, 'get', () => require('get-value'));
define(exports, 'typeOf', () => require('kind-of'));
define(exports, 'merge', () => require('mixin-deep'));
define(exports, 'pick', () => require('object.pick'));
define(exports, 'omitEmpty', () => require('omit-empty'));
define(exports, 'parseGitConfig', () => require('parse-git-config'));
define(exports, 'repo', () => require('repo-utils'));
define(exports, 'semver', () => require('semver'));
define(exports, 'stringify', () => require('stringify-author'));

/**
 * Return true if `val` is empty
 */

exports.isEmpty = val => {
  return Object.keys(exports.omitEmpty(val)).length === 0;
};

exports.unique = value => {
  return [...new Set([].concat(value))];
};

exports.exists = filepath => fs.existsSync(filepath);

/**
 * Return true if `val` is an object
 */

exports.isObject = val => {
  return exports.typeOf(val) === 'object';
};

/**
 * Return true if `val` is a string with a non-zero length
 */

exports.isString = val => {
  return val && typeof val === 'string';
};

/**
 * Cast `val` to an array
 */

exports.arrayify = val => {
  return val ? (Array.isArray(val) ? val : [val]) : [];
};

/**
 * Try to require the package.json at the given filepath
 */

exports.requirePackage = filepath => {
  filepath = path.resolve(filepath);
  try {
    var stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      filepath = path.join(filepath, 'package.json');
    } else if (!/package\.json$/.test(filepath)) {
      filepath = path.join(path.dirname(filepath), 'package.json');
    }
    return require(filepath);
  } catch (err) {}
  return {};
};

/**
 * Strip a trailing slash from a string.
 *
 * @param {String} `str`
 * @return {String}
 */

exports.stripSlash = str => str.replace(/\W+$/, '');
