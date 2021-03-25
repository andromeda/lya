module.exports = (lya) => {
  let env;

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
    updateAnalysisData(env.results[info.currentModule], info.nameToStore,
                       types[info.nameToStore], values);
    currentFunction.pop();
  };

  const onExit = (env, { saveIfAble, printIfAble }) => {
    saveIfAble();
    printIfAble();
  };

  
  env = lya.createLyaState({
    hooks: {
      onCallPre,
      onCallPost,
      onRead,
      onWrite,
      onExit,
    },
  });

  return env;
};
