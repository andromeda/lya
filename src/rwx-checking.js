let env;

const uniqueValid = new Set();
const uniqueInvalid = new Set();
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
let countValid = 0;
let countInvalid = 0;
let groundTruth;
let debug = false;

const log = (str, color) => {
  if (!debug) {
    return;
  }
  console.log(color? chalk[color].bold(str) : str);
};

// We need to get the path of the main module in order to find dynamic json
const getAnalysisData = () => {
  // We save all the json data inside an object
  const appDir = env.conf.rules? env.conf.rules : path.join(path.dirname(
      require.main.filename), 'correct.json');
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
  // This is a failback check
  if (!storedCalls) {
    return;
  }

  for (const key in modeGrid) {
    if (Object.prototype.hasOwnProperty.call(modeGrid, key)) {
      const mode = modeGrid[key];
      if (Object.prototype.hasOwnProperty.
          call(storedCalls, truename) === false) {
        log('Invalid access in: ' + truename + ' and mode ' + mode, 'red');
        uniqueInvalid.add(truename+mode);
        countInvalid++;
      } else {
        const permissions = storedCalls[truename];
        if (!permissions.includes(mode)) {
          log('Invalid access in: ' + truename + ' and mode ' + mode, 'red');
          uniqueInvalid.add(truename+mode);
          countInvalid++;
        } else {
          log('Valid access in: ' + truename + ' and mode ' + mode, 'green');
          uniqueValid.add(truename+mode);
          countValid++;
        }
      }
    }
  }
};

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (info) => {
  if (info.nameToStore != 'global') {
    const pattern = /require[(](.*)[)]/;
    if (pattern.test(info.nameToStore)) {
      checkRWX(groundTruth[info.currentModule],
          info.nameToStore.match(pattern)[0], ['r']);
    } else {
      checkRWX(groundTruth[info.currentModule],
          info.nameToStore.split('.')[0], ['r']);
    }
    checkRWX(groundTruth[info.currentModule],
        info.nameToStore, ['r']);
  }
};

// onWrite <~ is called before every write of an object
const onWrite = (info) => {
  checkRWX(groundTruth[info.currentModule], info.parentName, ['r']);
  checkRWX(groundTruth[info.currentModule], info.nameToStore, ['w']);
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (info) => {
  if (info.typeClass === 'module-locals') {
    checkRWX(groundTruth[info.currentModule],
        'require', ['r', 'x']);
    checkRWX(groundTruth[info.currentModule],
        info.nameToStore, ['i']);
  } else {
    if (info.typeClass === 'node-globals') {
      checkRWX(groundTruth[info.declareModule],
          info.nameToStore.split('.')[0], ['r']);
    }
    checkRWX(groundTruth[info.declareModule],
        info.nameToStore, ['r', 'x']);
  }
};

// There is also another number missing: how many of the total accesses were
const printExtended = () => {
  const totalAccess = countValid + countInvalid;
  log('-------------------------------------------------');
  log('Total number of wrappers: ' + env.counters.total, 'yellow');
  log('objects: ' + env.counters.objects, 'yellow');
  log('functions: ' + env.counters.functions, 'yellow');
  log('-------------------------------------------------');
  log('Valid accesses: ' + countValid, 'green');
  log('Invalid accesses: ' + countInvalid, 'red');
  log('Total accesses: ' + totalAccess, 'red');
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = () => {
  const debugName = env.conf.debugName ? env.conf.debugName : '';
  const total = env.counters.total;
  const ratio = (+(countInvalid / total).toFixed(5));
  const corr = countValid > 0 ? 'correct' : '';
  const msg = `${debugName} ${total} ${uniqueValid.size} ${uniqueInvalid.size} 
    ${countValid} ${countInvalid} ${ratio} ${corr}`;
  if (env.conf.printResults) {
    console.error(msg);
    printExtended();
  }
  if (env.conf.appendStats) {
    fs.appendFileSync(env.conf.appendStats, msg + '\n', 'utf-8');
  }
};

module.exports = (e) => {
  env = e;
  // TODO: env.conf.rules? env.conf.rules : passes a string
  groundTruth = getAnalysisData();
  debug = env.conf.debug;
  return {
    onRead: onRead,
    onCallPre: onCallPre,
    onWrite: onWrite,
    onExit: onExit,
  };
};
