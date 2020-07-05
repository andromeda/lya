let env;
let groundTruth;

// We need to get the path of the main module in order to find dynamic json
const getAnalysisData = () => {
  // We save all the json data inside an object
  const path = require('path');
  // TODO: Take this from env---relative to the file calling require('lya')!
  const appDir = path.join(path.dirname(require.main.filename), 'dynamic.json');
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
      throw new Error('Invalid access in: ' + truename + ' and mode ' + mode);
    } else {
      const permissions = storedCalls[truename];
      if (!permissions.includes(mode)) {
        throw new Error('Invalid access in: ' + truename + ' and mode ' + mode);
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
};

// onWrite <~ is called before every write of an object
const onWrite = (target, name, value, currentModule, parentName, nameToStore) => {
  checkRWX(groundTruth[currentModule], parentName, ['r']);
  checkRWX(groundTruth[currentModule], nameToStore, ['w']);
};

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

module.exports = (e) => {
  env = e;
  groundTruth = env.conf.rules? env.conf.rules : getAnalysisData();
  return {
    onRead: onRead,
    onCallPre: onCallPre,
    onWrite: onWrite,
  };
};
