#!/usr/bin/env node

if (require.main !== module) {
  return require('./src/txfm.js');
}

const fs = require('fs');
const path = require('path');
const arg = require('arg');
const pkg = require('./package.json');
const lya = require('./src/txfm.js');
const conf = require('./src/config.js').settings;

/* eslint-disable max-len */
const h = `Analyze JavaScript programs dynamically, to extract information or enforce invariants.

lya <fl> [hpVvvv] [a=<a.js>] [d=<n>] [{module, context, prop}-{include, exclude}=<m | c | p>]

  <fl>                        File to start analysis from (i.e., program entry point).

  -h,   --help:               Output (this) help 
  -V    --version:            Output version information
  -v, vv, vvv, --verbosity:   Add (multiple) verbosity levels

  -d,   --depth <n>:          Object depth to analyze (default 3)
  -a,   --analysis <a.js>:    The program analysis to execute (see below)
  -p,   --print [<out, err>]: Stream to output results (defaults to file, see above)
  -s,   --save <b.json>:      Stream output to a file (path or filename)
  
  --module-exclude <m>:       Comma-separated list of module IDs (absolute fs paths) to be excluded from the analysis
  --module-include <m>:       Comma-separated list of module IDs (absolute fs paths) to be included (assumes module-exclude='*')
  --context-exclude <c>:      Comma-separated context starting points to exclude from tracking (for contexts, see below)
  --context-include <c>:      Comma-separated context starting points to include in tracking  (assumes context-exclude='*')
  --prop-exclude <p>:         Comma-separated property names to exclude from analysis (e.g., 'Promise,toString,escape,setImmediate')
  --prop-include <p>:         Comma-separated property names to include in the  analysis (assumes prop-exclude='*')

  Contexts <c> are coarse groups of  program elements that are tracked, and fall
  under these categories (can be included in their long or short form):

  * module-locals, m:         Module-local names such as 'require'
  * node-globals, n:          All Node.js-related globals, such as 'console' and 'process'
  * es-globals, e:            All EcmaScript 6 globals names such Math.sin or 
  * user-globals, g:          User-defined globals accessed with a 'global' prefix, e.g., 'global.y = 3'
  * with-globals, w:          User-defined globals accessed without a prefix, e.g., 'y = 3' (expensive to track)

  Analyses can be a built-in or an absolute path to a user-defined analysis, and focus on the dynamic analysis target.
  Each analysis reads or writes its invariants in a file, whose path defaults to "./dynamic.json" but can be overwritten via  '-f <f>'.
  The full set of analyses can be found

  * allow_deny:               Extracts an access policy
  * allow_deny_enforcement:   Enforces an allow-deny access policy
  * call_time:                Extract call times for all function called
  * call_freq:                Extract call frequencies for all functions and fields part of the analysis target
  * global_only:              Capture accesses to global-only variables
  * term_index:               Calculate TF-IDF metrics on source code
`;
/* eslint-enable max-len */

const help = () => {
  console.log(h);
};

// const splitJoin = (a, separator) => {
//  const comb = a.split(separator);
//  const value = [];
//  comb.forEach((m) => value.push(path.join(__dirname, m)));
//  return value;
// };

// const { fstat } = require('fs');
const template = {
  // Types
  '--help': Boolean,
  '--version': Boolean,
  '--verbosity': arg.COUNT,

  '--depth': Number,
  '--analysis': String,
  '--print': Boolean,
  '--save': String,

  '--module-exclude': String,
  '--module-include': String,
  '--context-exclude': String,
  '--context-include': String,
  '--prop-exclude': String,
  '--prop-include': String,

  // Aliases
  '-h': '--help',
  '-V': '--version',
  '-v': '--verbosity',

  '-d': '--depth',
  '-a': '--analysis',
  '-p': '--print',
  '-s': '--save',
};

let args;
try {
  args = arg(template);
} catch (e) {
  console.log(e.message);
  process.exit();
}

if (args['--help']) {
  help();
  process.exit();
}

if (args['--version']) {
  console.log('v' + pkg.version); // + " (commit: 8799cd1)");
  process.exit();
}

if (args['--depth']) {
  conf.depth = args['--depth'];
}

if (args['--analysis']) {
  conf.analysis = path.join(__dirname, args['--analysis']);
}

if (args['--print']) {
  conf.print = args['--print'];
}

if (args['--save']) {
  conf.SAVE_RESULTS = path.join(__dirname, args['--save']);
}

if (args['--module-include']) {
  conf.modules.include = args['--module-include'];
}

if (args['--context-exclude']) {
  conf.context.excludes = args['--context-exclude'].split(',');
  console.log(conf.context.excludes);
}

let filePath;
switch (args['_'].length) {
  case 0:
    console.log('You must specify a file name');
    console.log('Exiting..');
    process.exit(-1);
    break;
  case 1:
    filePath = process.cwd() + path.sep + args['_'][0];
    if (!fs.existsSync(filePath)) {
      console.log('File does not exists');
      console.log('Exiting..');
      process.exit(-1);
    }
    break;
  default:
    console.log('Too many ``extra\'\' parameters: ' + args['_'].join(', '));
    process.exit(-1);
}

lya.configRequire(require, conf);
require(filePath);
