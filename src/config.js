const fs = require('fs');

const conf = {
  inputString: true,
  printCode: false,
  depth: 3,
  context: {
    enableWith: true,
    include: [
      'user-globals',
      'es-globals',
      'node-globals',
      'module-locals',
      'module-returns'],
    excludes: [],
  },
  modules: {
    include: null,
    excludes: null,
  },
  fields: {
    include: true,
    excludes: ['toString', 'valueOf', 'prototype', 'name', 'children'],
  },
};

const update = (newConfig) => {
  Object.assign(conf, newConfig);
  conf.analysis = conf.analysis || preset.ALLOW_DENY;
  if (!fs.existsSync(conf.analysis)) {
    console.error('Analysis file not found: ', conf.analysis);
    console.error('Exiting..');
    process.exit();
  }
  return conf;
}

module.exports = {
  settings: conf,
  update: update,
}

//   // Uncomment next line to find the current node version
//   // console.log("Node.js version is:", process.version);
//
//   // TODO: maybe exapand to a local
//   // TODO: create a function that assigns default values to the config
//   // TODO: Fix this part!!!!
//   conf.context = conf.context ? conf.context : systemPreset.CONTEXT;
//   conf.context.enableWith = conf.context.enableWith !== undefined ?  conf.context.enableWith : systemPreset.CONTEXT.enableWith;
//   conf.context.include = conf.context.include ? conf.context.include : systemPreset.CONTEXT.include;
//   conf.context.include = conf.context.excludes ? conf.context.include.filter((e) => !conf.context.excludes.includes(e)) : conf.context.include;
//   conf.context.excludes = conf.context.excludes ? conf.context.excludes : [];
//   conf.fields = conf.fields ? conf.fields : systemPreset.FIELDS;
//   conf.modules = conf.modules ? conf.modules : systemPreset.MODULES;
//   conf.inputString = conf.inputString === false ? conf.inputString: systemPreset.INPUT_STRING;
//   conf.printCode = conf.printCode ? conf.printCode : systemPreset.PRINT_CODE;
//   conf.depth = conf.depth ? conf.depth : systemPreset.DEPTH;

