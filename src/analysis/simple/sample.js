// The local env variable
// let env;

// This hook is called each time we import a module
// and lets the developer have access to the source code
// source <~ the source code of the imported module
// moduleName <~ the name of the required module
const sourceTransform = (info) => {
};

// This hook is called each time we initiate a new require
// caller <~ the module that calls the require function
// calle <~ the module that has been required
const onImport = (info) => {
};

// This hook is called before every object is read
// target <~ the target object
const onRead = (info) => {
};

// This hook is called before every write of an object
const onWrite = (info) => {
};

// This hook is called before the execution of a function
const onCallPre = (info) => {
};

// This hook is called after every execution of a function
const onCallPost = (info) => {
};

// This hook is called before every construct
const onConstruct = (info) => {
};

// This hook is called before every has
const onHas = (info) => {
};

// Choose what to do when the execution of program ends
const onExit = () => {
};

module.exports = (e) => {
//  env = e;
  return {
    sourceTransform: sourceTransform,
    onImport: onImport,
    onRead: onRead,
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onWrite: onWrite,
    onConstruct: onConstruct,
    onHas: onHas,
    onExit: onExit,
  };
};
