module.exports = (lya) => {
  let env;

  // @storedCalls it is a table that contains all the analysis data
  // @truename the name of the current function, object etc that we want to add to
  // the table
  // @mode the mode of the current access (R,W or E)
  const updateAnalysisData = (storedCalls, truename) => {
    storedCalls[truename] = (storedCalls[truename] || 0) + 1;
  };

  // onCallPre <~ is called before the execution of a function
  const onCallPre = (info) => {
    updateAnalysisData(env.results[info.currentModule], info.nameToStore);
  };

  // onExit (toSave == place to save the result) --maybe make it module-local?
  const onExit = (env, { saveIfAble, printIfAble }) => {
    /*
    for (const name of intersection) {
      const currentName = candidateModule.get(name);
      updateAnalysisData(env.analysisResult[currentName],
                         name);
    }
    */

    saveIfAble();
    printIfAble();
  };

    
  env = lya.createLyaState({
    hooks: {
      onCallPre,
      onExit,
    },
  });
  
  return env;
};
