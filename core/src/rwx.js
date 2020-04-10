let env;
const pattern = /require[(](.*)[)]/;
const fs = require('fs');

const candidateGlobs = new Set();
const candidateModule = new Map();

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
const updateAnalysisData = (storedCalls, truename, modeGrid) => {
  for (const key in modeGrid) {
    if (Object.prototype.hasOwnProperty.call(modeGrid, key)) {
      const mode = modeGrid[key];
      if (Object.prototype.hasOwnProperty.
          call(storedCalls, truename) === false) {
        storedCalls[truename] = mode;
      } else {
        addEvent(mode, storedCalls, truename);
      }
    }
  }
};

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (target, name, nameToStore, currentModule, typeClass) => {
  if (nameToStore !== 'global') {
    if (pattern.test(nameToStore)) {
      updateAnalysisData(env.analysisResult[currentModule],
          nameToStore.match(pattern)[0], ['r']);
    } else {
      updateAnalysisData(env.analysisResult[currentModule],
          nameToStore.split('.')[0], ['r']);
    }
    updateAnalysisData(env.analysisResult[currentModule],
        nameToStore, ['r']);
  }
};

// onWrite <~ is called before every write of an object
const onWrite = (target, name, value, currentModule, parentName,
    nameToStore) => {
  updateAnalysisData(env.analysisResult[currentModule], parentName, ['r']);
  updateAnalysisData(env.analysisResult[currentModule], nameToStore, ['w']);
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  if (typeClass === 'module-locals') {
    updateAnalysisData(env.analysisResult[currentModule],
        'require', ['r', 'x']);
    updateAnalysisData(env.analysisResult[currentModule],
        nameToStore, ['i']);
  } else {
    if (typeClass === 'node-globals') {
      updateAnalysisData(env.analysisResult[declareModule],
          nameToStore.split('.')[0], ['r']);
    }
    updateAnalysisData(env.analysisResult[declareModule],
        nameToStore, ['r', 'x']);
    if (pattern.test(nameToStore)) {
      updateAnalysisData(env.analysisResult[currentModule],
        nameToStore.match(pattern)[0], ['r']);
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
      nameToStore, ['r', 'x']);
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
  candidateGlobs.add(prop);
  if (!candidateModule.has(prop)) {
    candidateModule.set(prop, currentName);
    env.globalNames.set(prop, nameToStore);
  }
};

const intersection = (setA, setB) => {
    let _intersection = new Set();
    for (let elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }
    return _intersection
}

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = () => {
  const globalSet = new Set(Object.keys(global)); // this back to txfm
  for (const name of intersection(globalSet, candidateGlobs)) { // this back to txfm
    const currentName = candidateModule.get(name);
    updateAnalysisData(env.analysisResult[currentName],
        'global.'+name, ['w']);
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
