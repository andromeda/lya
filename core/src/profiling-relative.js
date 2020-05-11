let env;
const pattern = /require[(](.*)[)]/;
const fs = require('fs');
const storeTime = new Map();
// Array to store the time of the modules
const timeCapsule = {};

// Change the time parameters
const convert = hrtime => {
  const nanos = (hrtime[0] * 1e9) + hrtime[1];
  const millis = nanos / 1e6;
  const secs = nanos / 1e9;
  return { secs: secs, millis: millis, nanos: nanos };
};

// Normalize all values (seconds and to microseconds)
const toMillis = (a, b) => (a * 1e9 + b) * 1e-6;

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (target, name, nameToStore, currentModule, typeClass) => {
};

// onWrite <~ is called before every write of an object
const onWrite = (target, name, value, currentModule, parentName,
    nameToStore) => {
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  storeTime.set(target, process.hrtime());
};

// onCallPost <~ Is call after every execution of a function
const onCallPost = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass, result) => {
  const level = env.requireLevel;
  const time = storeTime.get(target);
  const diff = process.hrtime(time);
  const thisTime = toMillis(diff[0], diff[1]);
  if (timeCapsule[level]) {
    timeCapsule[level] += toMillis(diff[0], diff[1]);
  } else {
    timeCapsule[level] = toMillis(diff[0], diff[1]);
  };

  if (timeCapsule[level+1]) {
    env.analysisResult[currentModule][nameToStore] = thisTime -
      timeCapsule[level+1];
    timeCapsule[level+1] = 0;
  } else {
    env.analysisResult[currentModule][nameToStore] = thisTime;
  };
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
