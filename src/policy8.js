// This is the policy for true false analysis. Each time we access a variable
// or a function we write it with true in a export file dynamic.json 
let locEnv;

// Holds the end of each name store of new assigned global variables
// suffix for our own metadata
const endName = '@name';

// @storedCalls it is a table that contains all the analysis data
// @truename the name of the current function, object etc that we want to add to
// the table 
// Given those two inputs we can update the analysis data that are stored in storedCalls
const updateAnalysisData = (storedCalls, truename) => {
  if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = true;
    }
};

// This the handler of the require function. Every time a "require" is used to load up a module
// this handler is called. It updates the analysis data that are stored in the accessMatrix table.
const requireHandler = {
  apply: function(target, thisArg, argumentsList) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    const origReqModuleName = argumentsList[0];
    locEnv.accessMatrix[currentName]['require(\'' + origReqModuleName + '\')'] = true;
    return Reflect.apply(...arguments);
  },
};

// The handler of the global variable.Every time we access the global variabe in order to declare 
// or call a variable, then we can print it on the export file.
const globalHandler= {
  get: function(target, name) {
    // XXX[target] != 'undefined'
    if (typeof name === 'string'){
      if (typeof target[name+endName] != 'undefined') {
        const currentName = locEnv.trueName[locEnv.requireLevel];
        const nameToShow = target[name+endName];
        updateAnalysisData(locEnv.accessMatrix[currentName], nameToShow);
      }
    }

    return Reflect.get(target, name);
  },
  set: function(target, name, value) {
    if (typeof value === 'number') {
      const currentName = locEnv.trueName[locEnv.requireLevel];
      const nameToStore = 'global.' + name;
      const result = Reflect.set(target, name, value);
      // In order to exist a disticton between the values we declared ourselfs
      // We declare one more field with key value that stores the name
      Object.defineProperty(target, name+endName, {value: nameToStore});
      updateAnalysisData(locEnv.accessMatrix[currentName], nameToStore);

      return result;
    }

    return Reflect.set(target, name, value);
  },
};

// The handler of the all the function that are called inside a module. Every time we
// load a module with require it first execute all the code and then prepary and exports 
// all the export data. We use this handler to catch all the code that is executed on the 
// module.
const moduleHandler= {
  apply: function(target) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    updateAnalysisData(locEnv.accessMatrix[currentName],target.name);

    return Reflect.apply(...arguments);
  },
  get: function(target, name) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    updateAnalysisData(locEnv.accessMatrix[currentName], target.name);

    return Reflect.get(target, name);
  },
};

// The handler of the functions on the export module. Every time we require a module 
// and we have exports, we wrap them in a handler. Each time we call a function from inside
// exports this is the handler that we wrap the function.
const exportsFuncHandler= {
  apply: function(target, thisArg, argumentsList) {
    let truename;

    truename = locEnv.objName.get(target);
    const currentName = locEnv.objPath.get(target);
    truename = truename + '.' + target.name;

    return Reflect.apply(...arguments);
  },
};

// This is the handler of the export object. Every time we require a module, and it has
// export data we wrap those data in this handler. So this is the first layer of the 
// export data wraping. 
const m1 = new WeakMap();
const exportHandler = {
  get: function(target, name, receiver) {
    const type = typeof target[name];
    if (type != 'undefined' && target[name] != null && typeof name === 'string' &&
        (!(target[name] instanceof RegExp))) { // + udnefined
      // If we try to grab an object we wrap it in this proxy
      if (type === 'object') {
        if ((!(Object.entries(target[name]).length === 0))) {
          // We first return the obj to check that is not wraped in a proxy
          if (m1.has(target[name])) {
            return Reflect.get(target, name);
          }

          let truepath = locEnv.objPath.get(receiver);
          let truename = locEnv.objName.get(receiver);
          if (truename === undefined) {
            truename = locEnv.objName.get(target);
          }
          if (truepath === undefined) {
            truepath = locEnv.objPath.get(target);
          } 
          const localObject = target[name];

          target[name] = new Proxy(target[name], exportHandler);
          locEnv.objName.set(localObject, truename + '.' + name);
          locEnv.objPath.set(localObject, truepath);

          result = Reflect.get(target, name);
          m1.set(result, true);

          return result; 
        }
      } else if (type === 'function') {
        // We first return the obj to check that is not wraped in a proxy
        let localFunction = target[name];
        if (!m1.has(target[name])){
          Object.defineProperty(localFunction, 'name', {value: name});
          target[name] = new Proxy(localFunction, exportsFuncHandler);
        }
          
        locEnv.objPath.set(localFunction, locEnv.trueName[locEnv.requireLevel]);
        locEnv.objName.set(localFunction, locEnv.objName.get(target));
          
        result = Reflect.get(target, name);
        m1.set(result, true);
        return result;
      }
    }

    return Reflect.get(target, name);
  },
};

// This is the handler of the global constanst variables, like Math.PI etc. We store the name 
// in the same object but we use a different name, for example, for Math.PI we store the 
// name "Math.PI" in the object Math.PIPI. That way we can have accurate name analysis.
const globalConstHandler= {
  get: function(target, name) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    updateAnalysisData(locEnv.accessMatrix[currentName], target[name+name]);

    return Reflect.get(target, name);
  },
};

module.exports = (env) => {
	locEnv = env;
	return {
		require : requireHandler,
	  moduleHandler : moduleHandler,
    globalHandler : globalHandler,
    exportHandler : exportHandler,
    globalConstHandler : globalConstHandler,
	}
};
