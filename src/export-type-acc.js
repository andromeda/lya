let env;
const fs = require('fs');
const types = [];
const accessTable = [];
const currentFunction =[];

const updateAnalysisData = (storedCalls, truename, type, values) => {
  if (values === undefined) {
    values = [];
  }

  const saveData = {core: type, effect: [...values]};
  if (Object.prototype.hasOwnProperty.
      call(storedCalls, truename) === false) {
    storedCalls[truename] = saveData;
  }
};

const addAccessValues = (table, fuctionName, name) => {
  if (table[fuctionName] === undefined) {
    table[fuctionName] = new Set();
  }
  table[fuctionName].add(name);
};

const onRead = (target, name, nameToStore, currentModule, typeClass) => {
  addAccessValues(accessTable, currentFunction[currentFunction.length-1],
      nameToStore);
};

const onWrite = (target, name, value, currentModule, parentName,
    nameToStore) => {
  addAccessValues(accessTable, currentFunction[currentFunction.length-1],
      nameToStore);
};

const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  if (typeClass !== 'module-returns') {
    return;
  }

  const inputType = [];
  currentFunction.push(nameToStore);
  if (!argumentsList.length) {
    inputType.push('no-input');
  } else {
    for (let i = 0; i < argumentsList.length; i++) {
      inputType.push(typeof argumentsList[i]);
    }
  }
  types[nameToStore] = inputType;
};

const onCallPost = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass, result) => {
  if (typeClass !== 'module-returns') {
    return;
  }
  types[nameToStore].push(result ? typeof result : 'no output');
  const values = accessTable[currentFunction[currentFunction.length-1]];
  updateAnalysisData(env.analysisResult[currentModule], nameToStore,
      types[nameToStore], values);
  currentFunction.pop();
};

const onExit = (intersection, candidateModule) => {
  if (env.conf.SAVE_RESULTS) {
    fs.writeFileSync(env.conf.SAVE_RESULTS,
        JSON.stringify(env.analysisResult, null, 2), 'utf-8');
  }
  if (env.conf.print) {
    console.log(JSON.stringify(env.analysisResult, null, 2));
  }
};

module.exports = (e) => {
  env = e;
  env.conf.context.include = [
    'module-returns',
    'node-globals',
  ];
  return {
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onRead: onRead,
    onWrite: onWrite,
    onExit: onExit,
  };
};
