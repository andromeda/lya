'use strict';

const utils = require('../../utils');
const git = require('./git');

module.exports = function(val, key, config, schema) {
  let owner = config.owner;
  let url = val;

  if (utils.isObject(url)) {
    url = val.url;
  }

  let repo = config.repository;
  if (utils.isObject(repo) && repo.url) {
    repo = repo.url;
  }

  let obj;
  if (utils.isString(url)) {
    obj = utils.repo.parseUrl(url);
    schema.data.set('owner', obj.owner);
    return obj.owner;
  }

  if (utils.isString(repo)) {
    obj = utils.repo.parseUrl(repo);
    schema.data.set('owner', obj.owner);
    return obj.owner;
  }

  const parsed = git(val, key, config, schema);
  if (utils.isObject(parsed)) {
    schema.data.set('git', parsed);
    owner = parsed.user && parsed.user.name;

    if (owner) {
      schema.data.set('owner', owner);
      return owner;
    }
  }
};
