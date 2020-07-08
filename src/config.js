const fs = require('fs');
const pathJoin = require('path').join;

const preset = {
  CALL_NUMBERS: pathJoin(__dirname, 'call-numbers.js'),
  COARSE_TYPES: pathJoin(__dirname, 'coarse-types.js'),
  EXPORT_TYPE: pathJoin(__dirname, 'export-type.js'),
  GLOBAL_ONLY: pathJoin(__dirname, 'global-only.js'),
  IMPORTS: pathJoin(__dirname, 'imports.js'),
  ON_OFF: pathJoin(__dirname, 'on-off.js'),
  ON_OFF_ENFORCEMENT: pathJoin(__dirname, 'on-off-enforcement.js'),
  PROFILING: pathJoin(__dirname, 'profiling.js'),
  PROFILING_RELATIVE: pathJoin(__dirname, 'profiling-relative.js'),
  RWX: pathJoin(__dirname, 'rwx.js'),
  RWX_CHECKING: pathJoin(__dirname, 'rwx-checking.js'),
  RWX_ENFORCEMENT: pathJoin(__dirname, 'rwx-enforcement.js'),
  RWX_PERFORMANCE: pathJoin(__dirname, 'rwx-performance.js'),
  SIMPLE_TYPES: pathJoin(__dirname, 'simple-types.js'),
  STAR_CHECK: pathJoin(__dirname, 'star-check.js'),
  SUB_TYPES: pathJoin(__dirname, 'sub-types.js'),
  TERM_INDEX: pathJoin(__dirname, 'term-index.js'),
  UCOMMENT: pathJoin(__dirname, 'uncomment.js'),
};

const conf = {
  inputString: true,
  printCode: false,
  depth: 3,
  analysis: preset.ON_OFF,
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
