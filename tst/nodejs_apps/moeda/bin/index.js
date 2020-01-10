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
  amount: 1,
  from: 'USD',
  to: ['USD', 'EUR', 'GBP', 'BRL']
}

//for (i = 0; i < 1000; i++) {
  moeda(command)
//}
