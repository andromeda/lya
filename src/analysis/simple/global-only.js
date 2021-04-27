module.exports = (lya) => {
  let env;

  // @storedCalls it is a table that contains all the analysis data
  // @name the name of the current function, object etc that we want to add to
  // the table
  const updateAnalysisData = (results, name) => {
    results[name] = true;
  };

  // onCallPre <~ is called before the execution of a function
  const onCallPre = (info) => {
    if (info.typeClass === 'es-globals' || info.typeClass === 'node-globals' ) {
      updateAnalysisData(env.results[info.currentModule],
                         info.nameToStore);
    }
  };

  // onConstruct <~ Is call before every construct
  const onConstruct = (info) => {
    updateAnalysisData(env.results[info.currentName],
                       info.nameToStore, ['r', 'x']);
  };

  const onExit = ({ reportTimeIfAble, saveIfAble }) => {
    reportTimeIfAble();
    saveIfAble();
  };
  
  env = lya.createLyaState({
    hooks: {
      onCallPre,
      onConstruct,
      onExit,
    },
  });

  return env;
};
