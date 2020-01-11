lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 1,
  removejson: ['unescape']
};
let lya = require("../../../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

const chalk = require('chalk');
 
console.log(chalk.blue('Hello world!'));

const miles = 18;
const calculateFeet = miles => miles * 5280;
 
console.log(chalk`
    There are {bold 5280 feet} in a mile.
    In {bold ${miles} miles}, there are {green.bold ${calculateFeet(miles)} feet}.
`);