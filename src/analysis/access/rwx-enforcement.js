let env;
let groundTruth;
let key;
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
    if (Object.prototype.hasOwnProperty.call(modeGrid, key)) {
      const mode = modeGrid[key];
      if (Object.prototype.hasOwnProperty.
          call(storedCalls, truename) === false) {
        throw new Error('Invalid access in: ' + truename + ' and mode ' + mode);
      } else {
        const permissions = storedCalls[truename];
        if (!permissions.includes(mode)) {
          throw new Error('Invalid access in: ' + truename +
            ' and mode ' + mode);
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
      checkRWX(groundTruth[key],
          info.nameToStore.match(pattern)[0], ['r']);
    } else {
      checkRWX(groundTruth[key],
          info.nameToStore.split('.')[0], ['r']);
    }
    checkRWX(groundTruth[key],
        info.nameToStore, ['r']);
  }
};

// onWrite <~ is called before every write of an object
const onWrite = (info) => {
  checkRWX(groundTruth[key], info.parentName, ['r']);
  checkRWX(groundTruth[key], info.nameToStore, ['w']);
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (info) => {
  if (info.typeClass === 'module-locals') {
    checkRWX(groundTruth[key],
        'require', ['r', 'x']);
    checkRWX(groundTruth[key],
        info.nameToStore, ['i']);
  } else {
    if (info.typeClass === 'node-globals') {
      checkRWX(groundTruth[key],
          info.nameToStore.split('.')[0], ['r']);
    }
    checkRWX(groundTruth[key],
        info.nameToStore, ['r', 'x']);
  }
};

module.exports = (e) => {
  env = e;
  groundTruth = env.conf.rules? require(env.conf.rules) : getAnalysisData();
  Object.keys(groundTruth).forEach((keyS) => {
    key = keyS;
  });
  return {
    onRead: onRead,
    onCallPre: onCallPre,
    onWrite: onWrite,
  };
};
