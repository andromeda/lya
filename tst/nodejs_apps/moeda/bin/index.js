#!/usr/bin/env node
lyaConfig = {
    SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
    analysisCh: 2,
    removejson: ["unescape","Buffer"],	
};
let lya = require("../lya/txfm.js");
require = lya.configRequire(require, lyaConfig);

const helpers = require('./helpers.js')
const moeda = require('./moeda.js')

const argv = process.argv.slice(2)
//for (var i=0; i<2000; i++) {
helpers(argv)
//}

const command = {
  amount: 1,
  from: 'USD',
  to: ['USD', 'EUR', 'GBP', 'BRL']
}

for (var i=0; i<200; i++) {
moeda(command)
}
