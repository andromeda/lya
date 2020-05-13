#!/usr/bin/env node
let lya = require("/home/grigorisntousakis/lya/core/src/txfm.js");
let conf = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysis: lya.preset.RWX,
  context: {
    excludes: ["unescape","Buffer", 'indexOf', 'process'],
  },
};
lya.configRequire(require, conf);

const helpers = require('./helpers.js')
const moeda = require('./moeda.js')

const argv = process.argv.slice(2)
helpers(argv)

const command = {
  amount: argv[0] || 1,
  from: argv[1] || 'USD',
  to: (argv.length > 2) ? process.argv.slice(4) : ['USD', 'EUR', 'GBP', 'BRL']
}
moeda(command)
