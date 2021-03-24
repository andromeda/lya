const fs = require('fs');
const chalk = require('chalk');

module.exports = (lya) => {
  const env = lya.createLyaState();

  // Change the time parameters
  const convert = (hrtime) => {
    const nanos = (hrtime[0] * 1e9) + hrtime[1];
    const millis = nanos / 1e6;
    const secs = nanos / 1e9;
    return {secs: secs, millis: millis, nanos: nanos};
  };

  // onCallPre <~ is called before the execution of a function
  const onCallPre = (info) => {
    const types = [];

    // From here we get the type of each input argument
    // TODO: Maybe the unique key should the nameToStore?
    for (let i = 0; i < info.argumentsList.length; i++) {
      types[i] = typeof info.argumentsList[i];
    }

    console.log(chalk.green.bold('Input: '), chalk.yellow(types),
                info.nameToStore);
    // NOTE: The one hook could be added here
  };

  // onCallPost <~ Is call after every execution of a function
  const onCallPost = (info) => {
    // From here we get the result type of the module
    const type = info.result !== undefined ? typeof result : 'No result';

    console.log(chalk.blue.bold('Output: '), chalk.yellow(type),
                info.nameToStore);

    // NOTE: And the other hook here
  };

  Object.assign(env.config.hooks, {
    onCallPre,
    onCallPost,
  });

  return env;
};
