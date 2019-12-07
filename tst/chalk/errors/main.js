const chalk = require('chalk');
const log = console.log;

//// Nest styles
//log(chalk.red('Hello', chalk.underline.bgBlue('world') + '!'));//

//// Nest styles of the same type even (color, underline, background)
//log(chalk.green(
//	'I am a green line ' +
//	chalk.blue.underline.bold('with a blue substring') +
//	' that becomes green again!'
//));

// Use RGB colors in terminal emulators that support it.
log(chalk.keyword('orange')('Yay for orange colored text!'));
log(chalk.rgb(123, 45, 67).underline('Underlined reddish color'));
log(chalk.hex('#DEADED').bold('Bold gray!'));

const error = chalk.bold.red;
const warning = chalk.keyword('orange');

console.log(error('Error!'));
console.log(warning('Warning!'));