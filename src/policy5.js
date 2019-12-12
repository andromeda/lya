// env is {
//   trueName : trueName,
//   requireLevel : requireLevel,
//   accessMatrix: accessMatrix,
//   timeCapsule : timeCapsule,
// }
let locEnv;

const path = require('path');

// We need to get the path of the main module in order to find dynamic json
const createDynamicObj = () => {
  // We save all the json data inside an object
  const appDir = path.join(path.dirname(require.main.filename), 'dynamic.json');
  let dynamicData;
  try {
    dynamicData = require(lyaConfig.POLICY || appDir);
  } catch (e) {
    throw new Error('The dynamic.json file was not found!');
  }
  return dynamicData;
};

dynamicObj = createDynamicObj();


// The handler of require of Enforcement
const EnforcementCheck= {
  apply: function(target) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    const nameReq = target.name + '(\'' + arguments[2][0] +// In arguments[2][0]
      '\')';// Is the name we use to import
    if (Object.prototype.hasOwnProperty.
        call(dynamicObj, currentName, nameReq) === false) {
      throw new Error('Something went badly wrong on the require!');
    }

    return Reflect.apply( ...arguments);
  },
};

const exportControl = (storedCalls, truename) => {
	if (Object.prototype.hasOwnProperty.call(storedCalls, truename) === false) {
      throw new Error('Something went badly wrong in ' + truename);
    }
}

const exportFuncControl = (storedCalls, truename, arguments) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      throw new Error('Something went badly wrong in ' + truename);
    }

    return Reflect.apply(...arguments);
}

const onModuleControlFunc = (storedCalls, truename, arguments) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      throw new Error('Something went badly wrong!');
    }

    return Reflect.apply(...arguments);
}

const onModuleControl = (storedCalls, truename) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      throw new Error('Something went badly wrong in ' + truename);
    }
}

module.exports = (env) => {
	locEnv = env;
	return {
		require : EnforcementCheck,
		exportControl : exportControl,
		exportFuncControl : exportFuncControl,
		onModuleControlFunc : onModuleControlFunc,
		onModuleControl : onModuleControl,
	}
};