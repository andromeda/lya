let env;
const fs = require('fs');
const storeTime = new Map();
// Array to store the time of the modules
const timeCapsule = {};

// Change the time parameters
const convert = (hrtime) => {
  const nanos = (hrtime[0] * 1e9) + hrtime[1];
  const millis = nanos / 1e6;
  const secs = nanos / 1e9;
  return {secs: secs, millis: millis, nanos: nanos};
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
    env.analysisResult[info.currentModule][info.nameToStore] = thisTime -
      timeCapsule[level+1];
    timeCapsule[level+1] = 0;
  } else {
    env.analysisResult[info.currentModule][info.nameToStore] = thisTime;
  }
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
  if (env.conf.reportTime) {
    const timerEnd = process.hrtime(env.conf.timerStart);
    const timeMillis = convert(timerEnd).millis;
    console.log(timeMillis, 'Time');
  }
  if (env.conf.SAVE_RESULTS) {
    fs.writeFileSync(env.conf.SAVE_RESULTS,
        JSON.stringify(env.analysisResult, null, 2), 'utf-8');
  }
  if (env.conf.print) {
    console.log(JSON.stringify(env.analysisResult, null, 2), 'utf-8');
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
