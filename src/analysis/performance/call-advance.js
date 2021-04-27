module.exports = (lya) => {
  let env;

  const storeTime = new Map();
  const window = 2;
  // Array to store the time of the modules
  const timeCapsule = {};

  // Normalize tables in results
  const normalResult = (results) => {
    // eslint-disable-next-line guard-for-in
    for (const module in results) {
      // eslint-disable-next-line guard-for-in
      for (const name in results[module]) {
        const table = results[module][name];
        let sum = 0;
        let counter = 0;
        for (; counter < table.length; counter++) {
          sum += table[counter] / (1 / (counter + 1));
        }
        results[module][name] = sum / counter;
      }
    }
    return results;
  };

  // Normalize all values (seconds and to microseconds)
  const toMillis = (a, b) => (a * 1e9 + b) * 1e-6;

  // onCallPre <~ is called before the execution of a function
  const onCallPre = (info) => {
    storeTime.set(info.target, process.hrtime());
  };

  const onExit = ({ saveIfAble, printIfAble }) => {
    env.results = normalResult(env.results);
    saveIfAble();
    printIfAble();
  }
  
  // Store time results in a table keeping them within a certain window
  const storeResult = (module, name, storeTime, oldTime) => {
    if (env.results[module][name] === undefined) {
      env.results[module][name] = [];
    }

    if (oldTime !== undefined) {
      storeTime = storeTime - oldTime;
    }

    if (env.results[module][name].unshift(storeTime) > window) {
      env.results[module][name].pop();
    }
  };


  // onCallPost <~ Is call after every execution of a function
  const onCallPost = (info) => {
    const level = env.requireLevel;
    const time = storeTime.get(info.target);
    const diff = process.hrtime(time);
    const thisTime = toMillis(diff[0], diff[1]);
    if (timeCapsule[level]) {
      timeCapsule[level] += toMillis(diff[0], diff[1]);
    } else {
      timeCapsule[level] = toMillis(diff[0], diff[1]);
    }

    if (timeCapsule[level+1]) {
      storeResult(info.currentModule, info.nameToStore, thisTime,
                  timeCapsule[level+1]);
      timeCapsule[level+1] = 0;
    } else {
      storeResult(info.currentModule, info.nameToStore, thisTime);
    }
  };

  env = lya.createLyaState({
    hooks: {
      onCallPre,
      onCallPost,
      onExit,
    },
  });

  return env;
};
