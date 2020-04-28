let env;
const pattern = /require[(](.*)[)]/;
const fs = require('fs');

// We add the R or W or E to the existing string
const addEvent = (event, values, index) => {
  let permissions = values[index];
  if (!permissions.includes(event)) {
    permissions += event;
    permissions = permissions.split('').sort().join('');
    values[index] = permissions;
  }
};

// @storedCalls it is a table that contains all the analysis data
// @truename the name of the current function, object etc that we want to add to
// the table
// @mode the mode of the current access (R,W or E)
const updateAnalysisData = (storedCalls, truename) => {
  if (Object.prototype.hasOwnProperty.
      call(storedCalls, truename) === false) {
    storedCalls[truename] = 1;
  } else {
    storedCalls[truename]++;
  }
};

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (target, name, nameToStore, currentModule, typeClass) => {
  if (nameToStore !== 'global') {
    if (pattern.test(nameToStore)) {
      updateAnalysisData(env.analysisResult[currentModule],
          nameToStore.match(pattern)[0]);
    } else {
      updateAnalysisData(env.analysisResult[currentModule],
          nameToStore.split('.')[0]);
    }
    updateAnalysisData(env.analysisResult[currentModule],
        nameToStore);
  }
};

// onWrite <~ is called before every write of an object
const onWrite = (target, name, value, currentModule, parentName,
    nameToStore) => {
  if (parentName) {
    updateAnalysisData(env.analysisResult[currentModule], parentName);
  }
  updateAnalysisData(env.analysisResult[currentModule], nameToStore);
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  if (typeClass === 'module-locals') {
    updateAnalysisData(env.analysisResult[currentModule],
        'require');
    updateAnalysisData(env.analysisResult[currentModule],
        nameToStore);
  } else {
    if (typeClass === 'node-globals') {
      updateAnalysisData(env.analysisResult[declareModule],
          nameToStore.split('.')[0]);
    }
    updateAnalysisData(env.analysisResult[declareModule],
        nameToStore);
    if (pattern.test(nameToStore)) {
      updateAnalysisData(env.analysisResult[currentModule],
        nameToStore.match(pattern)[0]);
    }
  }
};

// onCallPost <~ Is call after every execution of a function
const onCallPost = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass, result) => {
};

// onConstruct <~ Is call before every construct
const onConstruct = (target, args, currentName, nameToStore) => {
  updateAnalysisData(env.analysisResult[currentName],
      nameToStore);
};

const onHas = (target, prop, currentName, nameToStore) => {
  // Idea: Put  all variable  names to  a Set called  "candidateGlobs" a  set is
  // great because (i) vars  with the same name will get added  once and (ii) it
  // allows efficient  union/intersection queries Then,  upon exit, we  take the
  // intersection of  candidateGlobs and Object.keys(globals) Then  we intersect
  // the two,  and assign "rw"  to the remaining;  (a refinement could  be about
  // read and write also updating a set and then taking the following formulas):
  // W = (candidateGlobs ⋂ globals) U globalWrites
  // R = globalReads                       (otherwise a read would have crushed)
  // RW = W ⋂ globalReads
  // TODO: Return to txfm
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
  for (const name of intersection) {
    const currentName = candidateModule.get(name);
    updateAnalysisData(env.analysisResult[currentName],
        name);
  }
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
