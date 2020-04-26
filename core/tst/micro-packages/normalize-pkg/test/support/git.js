'use strict';

const path = require('path');
const del = require('delete');
const gitty = require('gitty');

module.exports = function(cwd, remote, cb) {
  const repo = gitty(cwd);

  del(path.join(cwd, '.git'), function(err) {
    if (err) return cb(err);

    repo.init(function(err) {
      if (err) return cb(err);
      gitAdd(repo, remote, cb);
    });
  });
};

function gitAdd(repo, remote, cb) {
  repo.add(['.'], function(err) {
    if (err) return cb(err);

    firstCommit(repo, remote, cb);
  });
}

function firstCommit(repo, remote, cb) {
  repo.commit('first commit', function(err) {
    if (err) return cb(err);
    if (typeof remote === 'string') {
      repo.addRemote('origin', remote, cb);
    } else {
      cb();
    }
  });
}
