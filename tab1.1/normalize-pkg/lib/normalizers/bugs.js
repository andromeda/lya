'use strict';

const getOwner = require('./helpers/owner');
const utils = require('../utils');
const merge = require('../merge');

module.exports = function(val, key, config, schema) {
  merge(config, schema);

  val = val || config[key];
  if (schema.checked[key]) {
    return val;
  }

  let owner = config.owner;
  if (!utils.isString(owner)) {
    owner = getOwner(val, key, config, schema);
  }

  if (utils.isObject(val) && utils.isString(val.url) && hasOwner(owner, val.url)) {
    val = config[key] = { url: utils.repo.issues(utils.repo.homepage(val.url)) };
    return val;
  }

  schema.update('repository', config);
  if (utils.isString(config.repository) && hasOwner(owner, config.repository)) {
    return { url: utils.repo.issues(config.repository) };
  }

  if (utils.isString(config.homepage) && hasOwner(owner, config.homepage)) {
    return { url: utils.repo.issues(config.homepage) };
  }
};

function hasOwner(owner, str) {
  return str.indexOf(owner + '/') !== -1;
}
