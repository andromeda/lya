#!/usr/bin/env node

const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const writeJson = require('write-json');
const Normalizer = require('..');
const config = new Normalizer();

/**
 * Optionally specific a destination path
 */

const dest = argv.dest || argv.d || 'package.json';

/**
 * Write the file
 */

writeJson(dest, config.normalize(), err => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('done');
});
