'use strict';

const git = require('./helpers/git');
const getOwner = require('./helpers/owner');
const utils = require('../utils');
const merge = require('../merge');

module.exports = function(val, key, config, schema) {
  merge(config, schema);
  let owner = config.owner;

  val = val || config[key];
  if (schema.checked[key]) {
    return val;
  }

  if (utils.isObject(val) && val.url) {
    val = val.url;
  }

  if (!utils.isString(val)) {
    const parsed = git(val, key, config, schema);
    const remote = utils.get(parsed, 'remote.origin.url');

    if (parsed.user && parsed.user.username) {
      owner = parsed.user.username;
      config.owner = owner;
      schema.checked.owner = true;
    }

    if (remote) {
      const expanded = utils.repo.expandUrl(remote);
      const data = utils.merge({}, expanded, config);
      utils.merge(config, data);
      schema.data.merge(data);
    }
  }

  if (!utils.isString(val) && config.homepage) {
    val = config.homepage;
  }

  if (!owner) {
    owner = getOwner(val, key, config, schema);
  }
  if (config.name && owner) {
    val = owner + '/' + config.name;
  }

  if (utils.isString(val)) {
    schema.checked[key] = true;
    return utils.repo.repository(val);
  }

  // if not returned already, val is invalid
  delete config[key];
  return;
};
