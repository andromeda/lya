let env;
const fs = require('fs');
const types = [];
const accessTable = [];
const currentFunction = [];

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

const onRead = (info) => {
  addAccessValues(accessTable, currentFunction[currentFunction.length-1],
      info.nameToStore);
};

const onWrite = (info) => {
  const nameCheck = '.' + info.name;
  if (info.nameToStore.includes(nameCheck)) {
    info.nameToStore = info.nameToStore.replace(nameCheck, '');
  }
  addAccessValues(accessTable, currentFunction[currentFunction.length-1],
      info.nameToStore);
};

const onCallPre = (info) => {
  if (info.typeClass !== 'module-returns') {
    return;
  }

  const inputType = [];
  currentFunction.push(info.nameToStore);
  if (!info.argumentsList.length) {
    inputType.push('no-input');
  } else {
    for (let i = 0; i < info.argumentsList.length; i++) {
      inputType.push(typeof info.argumentsList[i]);
    }
  }
  types[info.nameToStore] = inputType;
};

const onCallPost = (info) => {
  if (info.typeClass !== 'module-returns') {
    return;
  }
  types[info.nameToStore].push(info.result ? typeof info.result : 'no output');
  const values = accessTable[currentFunction[currentFunction.length-1]];
  updateAnalysisData(env.analysisResult[info.currentModule], info.nameToStore,
      types[info.nameToStore], values);
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
  return {
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onRead: onRead,
    onWrite: onWrite,
    onExit: onExit,
  };
};
