const fs = require('fs');
const pathJoin = require('path').join;
const preset = {
  CALL_FREQ: pathJoin(__dirname, '../analysis/performance/call-freq.js'),
  CALL_TIMES: pathJoin(__dirname, '../analysis/performance/call-times.js'),
  COARSE_TYPES: pathJoin(__dirname, '../analysis/spec/coarse-types.js'),
  EXPORT_TYPE: pathJoin(__dirname, '../analysis/spec/export-type.js'),
  EXPORT_TYPE_ALL: pathJoin(__dirname, '../analysis/spec/export-type-all.js'),
  EXPORT_TYPE_EFFECT: pathJoin(__dirname,
      '../analysis/spec/export-type-effect.js'),
  GLOBAL_ONLY: pathJoin(__dirname, '../analysis/simple/global-only.js'),
  IMPORTS: pathJoin(__dirname, '../analysis/simple/imports.js'),
  ON_OFF: pathJoin(__dirname, '../analysis/access/on-off.js'),
  ON_OFF_ENFORCE: pathJoin(__dirname, '../analysis/access/on-off-enforce.js'),
  SIMPLE_TYPES: pathJoin(__dirname, '../analysis/spec/simple-types.js'),
  SUB_TYPES: pathJoin(__dirname, 'sub-types.js'),
  TERM_INDEX: pathJoin(__dirname, '../analysis/simple/term-index.js'),
  UNCOMMENT: pathJoin(__dirname, '../analysis/simple/uncomment.js'),
};

const conf = {
  inputString: true,
  printCode: false,
  depth: 3,
  analysis: preset.ON_OFF,
  enableWith: false,
  context: {
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
    include: false,
    excludes: [],
  },
};

const update = (newConfig) => {
  Object.assign(conf, newConfig);
  if (!fs.existsSync(conf.analysis)) {
    console.error('Analysis file not found: ', conf.analysis);
    console.error('Exiting..');
    process.exit();
  }
  return conf;
};

module.exports = {
  preset: preset,
  settings: conf,
  update: update,
};
