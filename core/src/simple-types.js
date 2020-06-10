let env;
const fs = require('fs');

const updateTypeData = (store, type) => {
  if (Object.prototype.hasOwnProperty.
      call(store, type) === false) {
    store[type] = {};
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
  
  for (let i = 0; i < argumentsList.length; i++) {
    const type = typeof argumentsList[i];
    console.log("Input ",type, nameToStore);
  }
};

// onCallPost <~ Is call after every execution of a function
const onCallPost = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass, result) => {
  
  console.log("Output: ", typeof result, nameToStore);
};

// onConstruct <~ Is call before every construct
const onConstruct = (target, args, currentName, nameToStore) => {
};

const onHas = (target, prop, currentName, nameToStore) => {
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
  if (env.conf.reportTime) {
    const timerEnd = process.hrtime(env.conf.timerStart);
    const timeMillis = convert(timerEnd).millis
    console.log(timeMillis, 'Time');
  };
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
