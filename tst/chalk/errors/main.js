lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 1,
  removejson: ['unescape']
};
let lya = require("../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

const chalk = require('chalk');
const log = console.log;

// Use RGB colors in terminal emulators that support it.
log(chalk.keyword('orange')('Yay for orange colored text!'));
log(chalk.rgb(123, 45, 67).underline('Underlined reddish color'));
log(chalk.hex('#DEADED').bold('Bold gray!'));//

//const error = chalk.bold.red;
//const warning = chalk.keyword('orange');//

//console.log(error('Error!'));
//console.log(warning('Warning!'));