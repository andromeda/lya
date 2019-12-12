// env is {
//   trueName : trueName,
//   requireLevel : requireLevel,
//   accessMatrix: accessMatrix,
//   timeCapsule : timeCapsule,
// }
let locEnv;

// Normalize all values (seconds and to microseconds)
let toMillis = (a, b) => (a * 1e9 + b) * 1e-6;

// The handler of require of Counter case_3
const RequireTime = {
  apply: function(target) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    const nameReq = target.name + '(\'' + arguments[2][0] +// In arguments[2][0]
      '\')';// Is the name we use to import
    const time = process.hrtime();
    const result = Reflect.apply( ...arguments);
    const diff = process.hrtime(time);
    locEnv.accessMatrix[currentName][nameReq] = toMillis(diff[0], diff[1]);
    return result;
  },
};

const exportFuncControl = (storedCalls, truename, arguments) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      const time = process.hrtime();
      const result = Reflect.apply( ...arguments);
      const diff = process.hrtime(time);
      storedCalls[truename] = toMillis(diff[0], diff[1]);

      return result;
    }

    return Reflect.apply(...arguments);
}

const onModuleControlFunc = (storedCalls, truename, arguments) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      const time = process.hrtime();
      const result = Reflect.apply( ...arguments);
      const diff = process.hrtime(time);
      storedCalls[truename] = toMillis(diff[0], diff[1]);

      return result;
    }

    return Reflect.apply(...arguments);
}

module.exports = (env) => {
	locEnv = env;
	return {
		require : RequireTime,
		exportFuncControl : exportFuncControl,
		onModuleControlFunc : onModuleControlFunc,
	}
};