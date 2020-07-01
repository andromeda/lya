let env;
const fs = require('fs');
const inputStore = [];

const updateAnalysisData = (storedCalls, truename, inputType, outputType) => {
  const saveData = 'input: ' + inputType + ' => output: ' + outputType;
  if (Object.prototype.hasOwnProperty.
      call(storedCalls, truename) === false) {
    storedCalls[truename] = saveData;
  } else {
    if (!storedCalls[truename].includes(saveData)) {
      storedCalls[truename] += ' || ' + saveData;
    }
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
  
  let inputType = '';
  if (!argumentsList.length) {
    inputType += 'no-input';
  } else {
    for (let i = 0; i < argumentsList.length; i++) {
      inputType += i + '.' + typeof argumentsList[i] + ' ';
    }
  }
  inputStore[nameToStore] = inputType;
};

// onCallPost <~ Is call after every execution of a function
const onCallPost = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass, result) => {
  const inputType = inputStore[nameToStore]; 
  const outputType = result ? typeof result : "no output"; 
  updateAnalysisData(env.analysisResult[currentModule], nameToStore, inputType, outputType);
};

// onConstruct <~ Is call before every construct
const onConstruct = (target, args, currentName, nameToStore) => {
};

const onHas = (target, prop, currentName, nameToStore) => {
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
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
