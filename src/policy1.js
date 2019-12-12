// env is {
//   trueName : trueName,
//   requireLevel : requireLevel,
//   accessMatrix: accessMatrix,
//   timeCapsule : timeCapsule,
// }
let locEnv;

// The handler of require of True-False case_1
const RequireTrue = {
  apply: function(target, thisArg, argumentsList) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    const origReqModuleName = argumentsList[0];
    locEnv.accessMatrix[currentName]['require(\'' + origReqModuleName + '\')'] = true;
    return Reflect.apply(...arguments);
  },
};

const exportControl = (storedCalls, truename) => {
	if (storedCalls === 'undefined') {
      storedCalls = {};
      storedCalls[truename] = true;
    } else {
      storedCalls[truename] = true;
    }
};

const exportFuncControl = (storedCalls, truename, arguments) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = true;
    }

    return Reflect.apply(...arguments);
};

const onModuleControlFunc = (storedCalls, truename, arguments) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = true;
    }

    return Reflect.apply(...arguments);
};

const onModuleControl = (storedCalls, truename) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = true;
    }
};

module.exports = (env) => {
	locEnv = env;
	return {
		require : RequireTrue,
		exportControl : exportControl,
		exportFuncControl : exportFuncControl,
		onModuleControlFunc : onModuleControlFunc,
		onModuleControl : onModuleControl,
	}
};
