const pattern = /require[(](.*)[)]/;

module.exports = (lya) => {
  let env;

  const {
    IDENTIFIER_CLASSIFICATIONS: {
      NODE_GLOBALS,
      CJS_EXPORTS,
    },
  } = lya;

  const updateAnalysisData = (resultKey, dotPath) => {
    const storedCalls = env.results[resultKey];
    if (!Object.prototype.hasOwnProperty.call(storedCalls, dotPath))
      storedCalls[dotPath] = true;
  };

  const onRead = ({ currentModule, nameToStore }) => {
    if (nameToStore !== 'global') {
      if (pattern.test(nameToStore)) {
        updateAnalysisData(currentModule, nameToStore.match(pattern)[0]);
      } else {
        updateAnalysisData(currentModule, nameToStore.split('.')[0]);
      }

      updateAnalysisData(currentModule, nameToStore);
    }
  };

  const onWrite = (info) => {
    if (info.parentName) {
      updateAnalysisData(info.currentModule, info.parentName);
    }
    updateAnalysisData(info.currentModule, info.nameToStore);
  };

  const onCallPre = ({ declareModule, typeClass, currentModule, nameToStore }) => {
    if (typeClass === CJS_EXPORTS) {
      updateAnalysisData(currentModule, 'require');
      updateAnalysisData(currentModule, nameToStore);
    } else {
      if (typeClass === NODE_GLOBALS) {
        updateAnalysisData(declareModule, nameToStore.split('.')[0]);
      }

      updateAnalysisData(declareModule, nameToStore);

      if (pattern.test(nameToStore)) {
        updateAnalysisData(currentModule, nameToStore.match(pattern)[0]);
      }
    }
  };

  const onConstruct = (info) => {
    updateAnalysisData(info.currentName, info.nameToStore);
  };

  const onExit = ({ saveIfAble, printIfAble }) => {
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
