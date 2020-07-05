let env;
const chalk = require('chalk');

// onRequire <~ Each time a require is made this functions is called
// caller <- calls the require
// calle <- the module we fetch
const onRequire = (caller, calle) => {
  console.log(chalk.blue("Module", caller), 
    chalk.green("calls the", calle));
};

module.exports = (e) => {
  env = e;
  return {
    onRequire: onRequire,
  };
};
