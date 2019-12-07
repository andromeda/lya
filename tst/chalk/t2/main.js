lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 1,
  removejson: ['unescape']
};
let lya = require("../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

const chalk = require('chalk');
const log = console.log;

console.log(chalk.blue('Hello world!'));

// Combine styled and normal strings
log(chalk.blue('Hello') + ' World' + chalk.red('!'));

// Compose multiple styles using the chainable API
log(chalk.blue.bgRed.bold('Hello world!'));

// Pass in multiple arguments
log(chalk.blue('Hello', 'World!', 'Foo', 'bar', 'biz', 'baz'));

// ES2015 template literal
log(`
CPU: ${chalk.red('90%')}
RAM: ${chalk.green('40%')}
DISK: ${chalk.yellow('70%')}
`);

let name = 'Greg'
console.log(chalk.green('Hello %s'), name);

//// Nest styles
log(chalk.red('Hello', chalk.underline.bgBlue('world') + '!'));//

// Nest styles of the same type even (color, underline, background)
log(chalk.green(
	'I am a green line ' +
	chalk.blue.underline.bold('with a blue substring') +
	' that becomes green again!'
));