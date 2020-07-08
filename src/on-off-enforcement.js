let env;
let groundTruth;

// We need to get the path of the main module in order to find dynamic json
const getAnalysisData = () => {
  // We save all the json data inside an object
  const path = require('path');
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
const checkInvalid = (storedCalls, truename) => {
  if (Object.prototype.hasOwnProperty.call(storedCalls, truename) === false) {
    throw new Error('Invalid access to: ' + truename);
  } else if (storedCalls[truename] === false) {
    throw new Error('Invalid access to: ' + truename);
  }
};

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (target, name, nameToStore, currentModule, typeClass) => {
  if (nameToStore != 'global') {
    const pattern = /require[(](.*)[)]/;
    if (pattern.test(nameToStore)) {
      checkInvalid(groundTruth[currentModule],
          nameToStore.match(pattern)[0]);
    } else {
      checkInvalid(groundTruth[currentModule],
          nameToStore.split('.')[0]);
    }
    checkInvalid(groundTruth[currentModule],
        nameToStore);
  }
};

// onWrite <~ is called before every write of an object
const onWrite = (target, name, value, currentModule, parentName,
    nameToStore) => {
  checkInvalid(groundTruth[currentModule], parentName);
  checkInvalid(groundTruth[currentModule], nameToStore);
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  if (typeClass === 'module-locals') {
    checkInvalid(groundTruth[currentModule],
        'require');
    checkInvalid(groundTruth[currentModule],
        nameToStore);
  } else {
    if (typeClass === 'node-globals') {
      checkInvalid(groundTruth[declareModule],
          nameToStore.split('.')[0]);
    }
    checkInvalid(groundTruth[declareModule],
        nameToStore);
  }
};

const onExit = () => {
};

module.exports = (e) => {
  env = e;
  groundTruth = env.conf.rules? env.conf.rules : getAnalysisData();
  return {
    onRead: onRead,
    onCallPre: onCallPre,
    onWrite: onWrite,
    onExit: onExit,
  };
};
