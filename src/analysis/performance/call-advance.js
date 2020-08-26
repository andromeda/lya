let env;
const fs = require('fs');
const storeTime = new Map();
const window = 2;
// Array to store the time of the modules
const timeCapsule = {};

// Store time results in a table keeping them within a certain window
const storeResult = (module, name, storeTime, oldTime) => {
  if (env.analysisResult[module][name] === undefined) {
    env.analysisResult[module][name] = [];
  }

  if (oldTime !== undefined) {
    storeTime = storeTime - oldTime;
  }

  if (env.analysisResult[module][name].unshift(storeTime) > window) {
    env.analysisResult[module][name].pop();
  }
};

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

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
  if (env.conf.SAVE_RESULTS) {
    fs.writeFileSync(env.conf.SAVE_RESULTS,
        JSON.stringify(env.analysisResult, null, 2), 'utf-8');
  }
  if (env.conf.print) {
    console.log(JSON.stringify(normalResult(env.analysisResult), null, 2),
        'utf-8');
  }
};

module.exports = (e) => {
  env = e;
  return {
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onExit: onExit,
  };
};
