#! /usr/bin/env node

module.exports = {
  callWithLya,
  findEntryModule,
};

var crypto = require('crypto');
var Module = require('module');
var path = require('path');
var fs = require('fs');

var acorn = require('acorn');
var astring = require('astring');

var instrument = require('./instrument.js');
var types = require('./types.js');

var originalWrap = Module.wrap.bind(Module);
var cjsArguments = ['exports', 'require', 'module', '__dirname', '__filename'];


function callWithLya(userCallWithLyaInput) {
  var callWithLyaInput = types.makeCallWithLyaInput(userCallWithLyaInput);
  Module.wrap = bindModuleWrapOverride(callWithLyaInput);

  try {
    var result = callWithLyaInput.onReady();
    Module.wrap = originalWrap;
    return callWithLyaInput.afterAnalysis(result);
  } catch (error) {
    Module.wrap = originalWrap;
    return callWithLyaInput.onError(error);
  }
}

function bindModuleWrapOverride(callWithLyaInput) {
  return function wrap(script) {
    // User gets first dibs.
    var rewriteModuleInput = types.makeRewriteModuleInput(callWithLyaInput, script);

    rewriteModuleInput = callWithLyaInput.onModuleWrap(rewriteModuleInput) || rewriteModuleInput;

    // Shebangs may break parsers, but we don't want to remove them.
    rewriteModuleInput.script = rewriteModuleInput.script.replace(/^\s*#!/, '//#!');
    rewriteModuleInput.script = rewriteModule(rewriteModuleInput);

    // Allow user to react to rewrites
    return rewriteModuleInput.afterRewriteModule(rewriteModuleInput);
  }
}


function rewriteModule(rewriteModuleInput) {
  var ast = acorn.parse(rewriteModuleInput.script, rewriteModuleInput.acornConfig);

  // A non-collidable global helps preserve own properties.
  var instId = generateIdentifier();
  var instrumentation = Object.assign({}, rewriteModuleInput);
  var rewritten = instrument.instrumentCode(ast, instId, instrumentation, rewriteModuleInput.onHook);
  global[instId] = instrumentation;

  // Move the user's CommonJS where instrumentation is visible.
  var userCjsExpr = originalWrap(rewritten).replace(/;$/, '');
  var userCjsCall = makeCallExpression(userCjsExpr, cjsArguments);
  var equipExpr = '(function (' + instId + '){return ' + userCjsCall + '})';

  // Inject transfer from global scope to function scope.
  var recvIIFE = '(' + extractIntrumentationCode + ')("' + instId + '")';
  var equipCall = makeCallExpression(equipExpr, [recvIIFE]);

  // A second wrap gives Lya control over the transition from the
  // beginning of the CommonJS module, to user code. It also
  // provides correct bindings for `extractIntrumentationCode`.
  return originalWrap(equipCall);
}


// This injectable code must appear in a CommonJS module to work.
var extractIntrumentationCode = minify(function x(id) {
  var instrumentation = global[id];

  // Prevent checking the global object for instrumentation.
  delete global[id];

  // For dodging shadows and surprising reassignments.
  instrumentation.global = global;
  instrumentation.module = module;
  instrumentation.exports = exports;
  instrumentation.require = require;
  instrumentation.__dirname = __dirname;
  instrumentation.__filename = __filename;

  return instrumentation;
}.toString());


// Non-collidable identifiers handles some cases of input code that
// tries to sabotage an analysis, but this alone does not make such an
// attack infeasible.
function generateIdentifier() {
  return '__lya' + crypto.randomBytes(4).toString('hex');
}

function makeCallExpression(fexpr, args) {
  return fexpr + '(' + args.join(',') + ')';
}

function minify(js) {
  var ast = acorn.parse(js, { ecmaVersion: 5 });
  return astring.generate(ast, { indent: '', lineEnd: '' })
}

function findEntryModule(require, userEntry) {
  if (!userEntry) {
    throw new Error('Please specify an input file as a command line argument.');
  }

  var completePath = path.resolve(process.cwd(), userEntry);
  var stats = fs.existsSync(completePath) && fs.statSync(completePath);
  var isFile = stats && stats.isFile();
  var entry = isFile ? completePath : userEntry;

  try {
    return require.resolve(entry);
  } catch (e) {
    if (isFile) {
      throw new Error('Tried to read as a file from ${completePath}');
    } else {
      throw new Error(`Could not resolve '${userEntry}' using require.resolve`);
    }
  }
}


if (require.main === module) {
  var entry = findEntryModule(require, process.argv[2]);
  var analysis = require(entry);
  var callWithLyaInput = analysis(process.argv.slice(3), module.exports);
  console.log(callWithLya(callWithLyaInput));
}
