let env;

const chalk = require('chalk');
let countValid = 0;
let countInvalid = 0;
let groundTruth;

// We need to get the path of the main module in order to find dynamic json
const getAnalysisData = () => {
  // We save all the json data inside an object
  const path = require('path');
  const appDir = path.join(path.dirname(require.main.filename), 'correct.json');
  let dynamicData;
  try {
    dynamicData = require(appDir);
  } catch (e) {
    throw new Error('The dynamic.json file was not found!');
  }
  return dynamicData;
};

// TODO: Make the path of the imported analysis result  not absolute
// etc.. /greg/home/lya/tst/main.js ~> main.js
const checkRWX = (storedCalls, truename, modeGrid) => {
  for (const key in modeGrid) {
    const mode = modeGrid[key];
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      console.log(chalk.red.bold('Invalid access in: ') +
        truename + ' and mode ' + mode);
      countInvalid++;
    } else {

      let permissions = storedCalls[truename];
      if (!permissions.includes(mode)) {
        console.log(chalk.red.bold('Invalid access in: ') +
          truename + ' and mode ' + mode);
        countInvalid++;
      } else {
        console.log(chalk.green.bold('Valid access in: ') +
          truename + ' and mode ' + mode);
        countValid++;
      }
    }
  }
};

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (target, name, nameToStore, currentModule, typeClass) => {
    if (nameToStore != 'global') {
      const pattern = /require[(](.*)[)]/;
      if (pattern.test(nameToStore)) {
        checkRWX(groundTruth[currentModule],
          nameToStore.match(pattern)[0], ['r']);
      } else {
        checkRWX(groundTruth[currentModule],
          nameToStore.split('.')[0], ['r']);
      }
      checkRWX(groundTruth[currentModule],
        nameToStore, ['r']);
    }
}

// onWrite <~ is called before every write of an object
const onWrite = (target, name, value, currentModule, parentName, nameToStore) => {
  checkRWX(groundTruth[currentModule], parentName, ['r']);
  checkRWX(groundTruth[currentModule], nameToStore, ['w']);
}

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
  currentModule, declareModule, typeClass) => {
  if (typeClass === 'module-locals') {
    checkRWX(groundTruth[currentModule],
      'require', ['r', 'x']);
    checkRWX(groundTruth[currentModule],
      nameToStore, ['i']);
  } else {
    if (typeClass === 'node-globals') {
      checkRWX(groundTruth[declareModule],
        nameToStore.split('.')[0], ['r']);
    }
    checkRWX(groundTruth[declareModule],
      nameToStore, ['r', 'x']);
  }
};

// onCallPost <~ Is call after every execution of a function
const onCallPost = (target, thisArg, argumentsList, name, nameToStore,
  currentModule, declareModule, typeClass, result) => {
}

// onConstruct <~ Is call before every construct
const onConstruct = (target, args, currentName, nameToStore) => {
  checkRWX(groundTruth[currentName], nameToStore, ['r', 'x']);
}

const onHas = (target, prop, currentName, nameToStore) => {
  //checkRWX(groundTruth[currentName], nameToStore, ['r', 'w']);
}

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = () => {
  if (env.conf.SAVE_RESULTS) {
    console.log('-------------------------------------------------');
    console.log(chalk.yellow.bold('Total number of wrapped objects and functions: '),
      env.counters.total);
    console.log(chalk.yellow.bold('Objects: '), env.counters.object);
    console.log(chalk.yellow.bold('Functions: '), env.counters.function);
    console.log('-------------------------------------------------');
    console.log(chalk.green.bold('Valid accesses: ',countValid));
    console.log(chalk.red.bold('Invalid accesses: ',countInvalid));
  }
}

module.exports = (e) => {
  env = e;
  // TODO: env.conf.rules? env.conf.rules : passes a string
  groundTruth = getAnalysisData();
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
