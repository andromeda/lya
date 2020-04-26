'use strict';

const getOwner = require('./helpers/owner');
const utils = require('../utils');
const merge = require('../merge');

module.exports = function(val, key, config, schema) {
  merge(config, schema);
  let res;

  val = val || config[key];
  if (utils.isString(val) && /:\/\//.test(val)) {
    return val;
  }

  schema.update('repository', config);

  if (utils.isString(config.repository)) {
    res = utils.repo.homepage(config.repository);
    schema.checked[key] = true;
    return res;
  }

  let owner = config.owner;
  if (!utils.isString(owner)) {
    owner = getOwner(val, key, config, schema);
  }

  if (utils.isString(owner) && utils.isString(config.name)) {
    res = utils.repo.homepage(owner + '/' + config.name);
    schema.checked[key] = true;
    return res;
  }
};
