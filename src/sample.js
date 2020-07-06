// TODO: Add explanation for the rest of the import values

// This hook is called each time we import a module
// and lets the developer have access to the source code
// source <~ the source code of the imported module
// moduleName <~ the name of the required module
const sourceTransform = (source, moduleName) => {
};

// This hook is called each time we initiate a new require
// caller <~ the module that calls the require function
// calle <~ the module that has been required
const onImport = (caller, calle, name) => {
};

// This hook is called before every object is read
// target <~ the target object
const onRead = (target, name, nameToStore, currentModule, typeClass) => {
};

// This hook is called before every write of an object
const onWrite = (target, name, value, currentModule, parentName,
    nameToStore) => {
};

// This hook is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
};

// This hook is called after every execution of a function
const onCallPost = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass, result) => {
};

// This hook is called before every construct
const onConstruct = (target, args, currentName, nameToStore) => {
};

// This hook is called before every has
const onHas = (target, prop, currentName, nameToStore) => {
};

// Choose what to do when the execution of program ends
const onExit = (intersection, candidateModule) => {
};

module.exports = (e) => {
//  env = e;
  return {
    sourceTransform: sourceTransform,
    onRequire: onRequire,
    onRead: onRead,
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onWrite: onWrite,
    onConstruct: onConstruct,
    onHas: onHas,
    onExit: onExit,
  };
};
