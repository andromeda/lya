let env;
const fs = require('fs');
const chalk = require('chalk');

const updateTypeData = (store, type) => {
  if (Object.prototype.hasOwnProperty.
      call(store, type) === false) {
    store[type] = {};
  }
};

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (target, name, nameToStore, currentModule, typeClass) => {
};

// onWrite <~ is called before every write of an object
const onWrite = (target, name, argumentsList, currentModule, parentName,
    nameToStore) => {

}

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  const types = [];
  
  // From here we get the type of each input argument
  // TODO: Maybe the unique key should the nameToStore?
  for (let i = 0; i < argumentsList.length; i++) {
    types[i] = typeof argumentsList[i];

  }

  console.log(chalk.green.bold("Input: "), chalk.yellow(types), nameToStore);
  // NOTE: The one hook could be added here
};

// onCallPost <~ Is call after every execution of a function
const onCallPost = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass, result) => {
  // From here we get the result type of the module
  const type = result !== undefined ? typeof result : "No result"; 

  console.log(chalk.blue.bold("Output: "), chalk.yellow(type), nameToStore);

  // NOTE: And the other hook here
};

// onConstruct <~ Is call before every construct
const onConstruct = (target, args, currentName, nameToStore) => {
};

const onHas = (target, prop, currentName, nameToStore) => {
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
  if (env.conf.reportTime) {
    const timerEnd = process.hrtime(env.conf.timerStart);
    const timeMillis = convert(timerEnd).millis
    console.log(timeMillis, 'Time');
  };
  if (env.conf.SAVE_RESULTS) {
    fs.writeFileSync(env.conf.SAVE_RESULTS, 
      JSON.stringify(env.analysisResult, null, 2), 'utf-8');
  }
}

module.exports = (e) => {
  env = e;
  return {
    onRead: onRead,
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onWrite: onWrite,
    onConstruct: onConstruct,
    onHas: onHas,
    onExit: onExit,
  };
};
