#!/usr/bin/env node
lyaConfig = {
    SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
    analysisCh: 1,
    removejson: ["unescape","Buffer"],	
};
let lya = require("../lya/txfm.js");
require = lya.configRequire(require, lyaConfig);

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
