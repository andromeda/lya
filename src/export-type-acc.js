let env;
const fs = require('fs');
const inputStore = [];
const accessTable = [];
const currentFunction =[];

const updateAnalysisData = (storedCalls, truename, inputType,
    outputType, values) => {
  if (values !== undefined) {
    values = ' ! {' + values.toString().replace(/,/g, ', ') + '}';
  } else {
    values = '';
  }

  const saveData = '(' + inputType + outputType + ')' + values;
  if (Object.prototype.hasOwnProperty.
      call(storedCalls, truename) === false) {
    storedCalls[truename] = saveData;
  } else {
    if (!storedCalls[truename].includes(saveData)) {
      storedCalls[truename] += ' || ' + saveData;
    }
  }
};

const addAccessValues = (table, fuctionName, name) => {
  if (table[fuctionName] === undefined) {
    table[fuctionName] = [];
  }
  table[fuctionName].push(name);
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
  let inputType = '';
  currentFunction.push(nameToStore);
  if (!argumentsList.length) {
    inputType += 'no-input';
  } else {
    for (let i = 0; i < argumentsList.length; i++) {
      inputType += typeof argumentsList[i] + ' -> ';
    }
  }
  inputStore[nameToStore] = inputType;
};

const onCallPost = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass, result) => {
  const inputType = inputStore[nameToStore];
  const outputType = result ? typeof result : 'no output';
  const values = accessTable[currentFunction[currentFunction.length-1]];
  updateAnalysisData(env.analysisResult[currentModule], nameToStore, inputType,
      outputType, values);
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
