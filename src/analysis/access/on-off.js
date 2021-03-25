const pattern = /require[(](.*)[)]/;

module.exports = (lya) => {
  let env;

  // @storedCalls it is a table that contains all the analysis data
  // @truename the name of the current function, object etc that we want to add to
  // the table
  const updateAnalysisData = (storedCalls, truename) => {
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = true;
    }
  };

  // Analyses provided by LYA.
  // onRead <~ is called before every object is read
  const onRead = (info) => {
    if (info.nameToStore !== 'global') {
      if (pattern.test(info.nameToStore)) {
        updateAnalysisData(env.results[info.currentModule],
                           info.nameToStore.match(pattern)[0]);
      } else {
        updateAnalysisData(env.results[info.currentModule],
                           info.nameToStore.split('.')[0]);
      }
      updateAnalysisData(env.results[info.currentModule],
                         info.nameToStore);
    }
  };

  // onWrite <~ is called before every write of an object
  const onWrite = (info) => {
    if (info.parentName) {
      updateAnalysisData(env.results[info.currentModule], info.parentName);
    }
    updateAnalysisData(env.results[info.currentModule], info.nameToStore);
  };

  // onCallPre <~ is called before the execution of a function
  const onCallPre = (info) => {
    if (info.typeClass === 'module-locals') {
      updateAnalysisData(env.results[info.currentModule],
                         'require');
      updateAnalysisData(env.results[info.currentModule],
                         info.nameToStore);
    } else {
      if (info.typeClass === 'node-globals') {
        updateAnalysisData(env.results[info.declareModule],
                           info.nameToStore.split('.')[0]);
      }
      updateAnalysisData(env.results[info.declareModule],
                         info.nameToStore);
      if (pattern.test(info.nameToStore)) {
        updateAnalysisData(env.results[info.currentModule],
                           info.nameToStore.match(pattern)[0]);
      }
    }
  };

  // onConstruct <~ Is call before every construct
  const onConstruct = (info) => {
    updateAnalysisData(env.results[info.currentName],
                       info.nameToStore);
  };

  const onExit = (env, { saveIfAble, printIfAble }) => {
    /*
    for (const name of intersection) {
      const currentName = candidateModule.get(name);
      updateAnalysisData(env.analysisResult[currentName],
                         name, ['w']);
    }
    */

    saveIfAble();
    printIfAble();
  };

  env = lya.createLyaState({
    hooks: {
      onRead,
      onCallPre,
      onWrite,
      onConstruct,
      onExit,
    },
  });

  return env;
};
