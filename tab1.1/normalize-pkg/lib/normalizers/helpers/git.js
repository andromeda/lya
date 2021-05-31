'use strict';

const utils = require('../../utils');

module.exports = function(val, key, config, schema) {
  let git = schema.data.get('git');
  if (git) return git;

  git = tryGitConfig();
  if (utils.isObject(git)) {
    schema.data.set('git', git);
    return git;
  }
};

function tryGitConfig() {
  try {
    const git = utils.repo.gitConfig({ type: 'local' })
      || utils.repo.gitConfig({ type: 'global' });

    return parseKeys(git);
  } catch (err) {}
}

function parseKeys(git) {
  return utils.merge({}, git, utils.parseGitConfig.expandKeys(git));
}
