let env;
const fs = require('fs');
const chalk = require('chalk');

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

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
  if (env.conf.reportTime) {
    const timerEnd = process.hrtime(env.conf.timerStart);
    const timeMillis = convert(timerEnd).millis;
    console.log(timeMillis, 'Time');
  }
  if (env.conf.SAVE_RESULTS) {
    fs.writeFileSync(env.conf.SAVE_RESULTS,
        JSON.stringify(env.analysisResult, null, 2), 'utf-8');
  }
};

module.exports = (e) => {
  env = e;
  return {
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onExit: onExit,
  };
};
