let env;

const chalk = require('chalk');
let countValid = 0;
let countInvalid = 0;
let groundTruth;
let debug = false;

let log = (str, color) => {
  if (!debug)
    return
  console.log(color? chalk[color].bold(str) : str)
}

// We need to get the path of the main module in order to find dynamic json
const getAnalysisData = () => {
  // We save all the json data inside an object
  const path = require('path');
  const appDir = env.conf.rules? env.conf.rules : path.join(path.dirname(require.main.filename), 'correct.json');
  let dynamicData;
  try {
    dynamicData = require(appDir);
  } catch (e) {
    throw new Error(appDir + ' file was not found!');
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
      log("Invalid access in: " + truename + " and mode " + mode, "red");
      countInvalid++;
    } else {

      let permissions = storedCalls[truename];
      if (!permissions.includes(mode)) {
        log("Invalid access in: " + truename + " and mode " + mode, "red");
        countInvalid++;
      } else {
        log("Valid access in: " + truename + " and mode " + mode, "green");
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

// There is also another number missing: how many of the total accesses were
let printExtended = () => {
  const totalAccess = countValid + countInvalid;
  log('-------------------------------------------------');
  log('Total number of wrappers: ' + env.counters.total, "yellow");
  log("objects: " + env.counters.objects, "yellow");
  log("functions: " + env.counters.functions, "yellow");
  log('-------------------------------------------------');
  log('Valid accesses: ' + countValid, "green");
  log('Invalid accesses: ' + countInvalid, "red");
  log('Total accesses: ' + totalAccess, "red");
}

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = () => {
  if (env.conf.printResults) {
    let total = env.counters.total;
    console.error(total, countValid, countInvalid, +(countInvalid / total).toFixed(5), countValid > 0? 'correct' : '');
    printExtended();
  }
}

module.exports = (e) => {
  env = e;
  // TODO: env.conf.rules? env.conf.rules : passes a string
  groundTruth = getAnalysisData();
  debug = env.conf.debug;
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
