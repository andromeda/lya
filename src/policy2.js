// env is {
//   trueName : trueName,
//   requireLevel : requireLevel,
//   accessMatrix: accessMatrix,
//   timeCapsule : timeCapsule,
// }
let locEnv;

// The handler of require of Counter case_2
const RequireCounter= {
  apply: function(target) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    const nameReq = target.name + '(\'' + arguments[2][0] +// In arguments[2][0]
      '\')';// Is the name we use to import
    locEnv.accessMatrix[currentName][nameReq] = 1;

    return Reflect.apply( ...arguments);
  },
};

const exportControl = (storedCalls, truename) => {
	if (storedCalls === 'undefined') {
      storedCalls = {};
      storedCalls[truename] = 1;
    } else {
      if (storedCalls[truename] === undefined) {// Why this undef?
        storedCalls[truename] = 1;
      } else {
        storedCalls[truename]++;
      }
    }
};

const exportFuncControl = (storedCalls, truename, arguments) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = 1;
    } else {
      storedCalls[truename]++;
    }

    return Reflect.apply(...arguments);	
};

const onModuleControlFunc = (storedCalls, truename, arguments) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = 1;
    } else {
      storedCalls[truename]++;
    }

    return Reflect.apply(...arguments);	
}

const onModuleControl = (storedCalls, truename) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = 1;
    } else {
      storedCalls[truename]++;
    }
}

module.exports = (env) => {
	locEnv = env;
	return {
		require : RequireCounter,
		exportControl : exportControl,
		exportFuncControl : exportFuncControl,
		onModuleControlFunc : onModuleControlFunc,
		onModuleControl : onModuleControl,
	}
};
