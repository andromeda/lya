lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 1,
  removejson: ['unescape']
};
let lya = require("../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

const chalk = require('chalk');
const log = console.log;

// Found the problem with that 
// We need to change the place we save truename and truepath
// Not inside the object but maybe on WeakMap -- toDo
// Use RGB colors in terminal emulators that support it.
log(chalk.keyword('orange')('Yay for orange colored text!'));
//log(chalk.rgb(123, 45, 67).underline('Underlined reddish color'));
//log(chalk.hex('#DEADED').bold('Bold gray!'));//


//const warning = chalk.keyword('orange');//

//console.log(warning('Warning!'));
