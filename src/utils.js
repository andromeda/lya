const pathJoin = require('path').join;

const preset = {
  ALLOW_DENY: pathJoin(__dirname, 'allow-deny.js'),
  CALL_NUMBERS: pathJoin(__dirname, 'call-numbers.js'),
  PROFILING: pathJoin(__dirname, 'profiling.js'),
  PROFILING_RELATIVE: pathJoin(__dirname, 'profiling-relative.js'),
  ALLOW_DENY_ENFORCEMENT: pathJoin(__dirname, 'allow-deny-enforcement.js'),
  RWX: pathJoin(__dirname, 'rwx.js'),
  RWX_ENFORCEMENT: pathJoin(__dirname, 'rwx-enforcement.js'),
  RWX_CHECKING: pathJoin(__dirname, 'rwx-checking.js'),
  RWX_PERFORMANCE: pathJoin(__dirname, 'rwx-performance.js'),
  GLOBAL_ONLY: pathJoin(__dirname, 'global-only.js'),
  EXPORT_TYPE: pathJoin(__dirname, 'export-type.js'),
  COARSE_TYPES: pathJoin(__dirname, 'coarse-types.js'),
  SIMPLE_TYPES: pathJoin(__dirname, 'simple-types.js'),
  SUB_TYPES: pathJoin(__dirname, 'sub-types.js'),
  STAR_CHECK: pathJoin(__dirname, 'star-check.js'),
  UCOMMENT: pathJoin(__dirname, 'uncomment.js'),
  TERM_INDEX: pathJoin(__dirname, 'term-index.js'),
  PRINT_REQUIRE: pathJoin(__dirname, 'print-require.js'),
};

module.exports = {
  identity: () => {},
  preset: preset
}
