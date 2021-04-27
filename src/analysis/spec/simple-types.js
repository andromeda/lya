const chalk = require('chalk');

module.exports = (lya) => {
  let env;

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

  const onExit = ({ saveIfAble, reportTimeIfAble }) => {
    saveIfAble();
    reportTimeIfAble();
  };

  env = lya.createLyaState({
    hooks: {
      onCallPre,
      onCallPost,
      onExit,
    },
  });

  return env;
};
