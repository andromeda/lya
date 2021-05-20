#! /usr/bin/env node

require('fs')
  .readdirSync(__dirname)
  .filter((fn) => /\.test\.js$/.test(fn))
  .forEach((fn) => require('./' + fn));
