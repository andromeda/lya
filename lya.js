#!/usr/bin/env node

if (require.main !== module) {
  return require('./src/core.js');
}

const fs = require('fs');
const path = require('path');
const arg = require('arg');
const pkg = require('./package.json');
const lya = require('./src/core.js');
const conf = require('./src/utils/config.js').settings;
const preset = require('./src/utils/config.js').preset;

/* eslint-disable max-len */
const h = `Analyze JavaScript programs dynamically, to extract information or enforce invariants.

lya <fl> [hpVvvv] [a=<a.js>] [d=<n>] [{module, context, prop}-{include, exclude}=<m | c | p>]

  <fl>                        File to start analysis from (i.e., program entry point).

  -h,   --help:               Output (this) help 
  -V    --version:            Output version information
  -v, vv, vvv, --verbosity:   Add (multiple) verbosity levels

  -d,   --depth <n>:          Object depth to analyze (default 3)
  -a,   --analysis <a.js>:    The program analysis to execute (see below)
  -f,   --file <b.json>:      File/path to save results; defaults to 'lya.json'
  -r,   --rules <b.json>:     File/path to enforcement file
  -p,   --print [<out, err>]: Stream to output results (defaults to file)
  -o,   --only-prologue:      Print only the config prologue
  -w,   --enable-with	      Enable with functionality
  
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

  Analyses can be one of the build-in options below, or any absolute file-system path pointing to a user-defined analysis.
  Each analysis reads/writes invariants from/to a file, whose path defaults to "./lya.json" but can be overwritten via  '-f <f>'.

  Simple
  * imports:                  Extract dynamic dependency graph
  * global-only:              Extract accesses to global-only variables
  * sample                    No-op analysis used as a starting point
  * term-index:               Calculate TF-IDF metrics on source code
  * uncomment:                Uncomment code

  Access
  * on-off:                   Extracts an allow-deny access policy
  * on-off-enforce:           Enforces an allow-deny access policy

  Performance
  * call-time:                Extract call times for all functions called
  * call-freq:                Extract call frequencies for all functions and fields part of the analysis target

  Partial Specification
  * io                        Extract a base type signature every module field
  * io-effects                Extract a module type signature that includes effects

`;
// TODO: get analyses programmatically

/* eslint-enable max-len */

const help = () => {
  console.log(h);
};

const splitAdd = (a, separator, join) => {
  const comb = a.split(separator);
  const value = [];
  if (join) {
    comb.forEach((m) => value.push(path.join(__dirname, m)));
  } else {
    comb.forEach((m) => value.push(m));
  }
  return value;
};

// const { fstat } = require('fs');
const template = {
  // Types
  '--help': Boolean,
  '--version': Boolean,
  '--verbosity': arg.COUNT,

  '--depth': Number,
  '--analysis': String,
  '--print': Boolean,
  '--file': String,
  '--rules': String,
  '--only-prologue': Boolean,
  '--enable-with': Boolean,

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
  '-f': '--file',
  '-r': '--rules',
  '-o': '--only-prologue',
  '-w': '--enable-with',
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
  let p = args['--analysis'].replace('-', '_').toUpperCase();
  if (Object.keys(preset).includes(p)) {
    conf.analysis = preset[p];
  } else {
    if (args['--analysis'].startsWith('/')) {
      conf.analysis = path.resolve(args['--analysis']);
      // console.log(conf.analysis)
    } else {
      conf.analysis = path.join(process.cwd(), args['--analysis']);
      // console.log(conf.analysis)
    }
  }
}

if (args['--print']) {
  conf.print = args['--print'];
}

if (args['--file']) {
  conf.SAVE_RESULTS = path.join(process.cwd(), args['--file']);
  // TODO this should be the same if loading results
}

if (args['--rules']) {
  conf.rules = path.join(process.cwd(), args['--rules']);
  // TODO this should be the same if loading results
}

if (args['--module-include']) {
  conf.modules.include = splitAdd(args['--module-include'], ',', true);
}

if (args['--module-exclude']) {
  conf.modules.excludes = splitAdd(args['--module-exclude'], ',', true);
}

if (args['--context-include']) {
  conf.context.include = splitAdd(args['--context-include'], ',', false);
}

if (args['--context-exclude']) {
  const excl = splitAdd(args['--context-exclude'], ',', false);
  conf.context.include = conf.context.include.filter((name) => {
    if (excl.indexOf(name)) {
      return name;
    }
  });
  console.log(conf.context.excludes);
}

if (args['--prop-exclude']) {
  conf.fields.excludes = splitAdd(args['--prop-exclude'], ',', false);
}

if (args['--prop-include']) {
  conf.fields.include = splitAdd(args['--prop-include'], ',', false);
}

let filePath;
switch (args['_'].length) {
  case 0:
    console.log('You must specify a file name');
    process.exit(-1);
  case 1:
    filePath = process.cwd() + path.sep + args['_'][0];
    if (!fs.existsSync(filePath)) {
      console.log('File does not exist');
      process.exit(-1);
    }
    break;
  default:
    console.log('Too many ``extra\'\' parameters: ' + args['_'].join(', '));
    process.exit(-1);
}

if (args['--enable-with']) {
  conf.enableWith = true;
}

// print prologue
if (args['--only-prologue']) {
  console.log(conf)
  process.exit(0);
}

lya.configRequire(require, conf);
require(filePath);
