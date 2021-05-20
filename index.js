#! /usr/bin/env node

module.exports = {
  callWithLya,
};

var crypto = require('crypto');
var Module = require('module');
var path = require('path');
var fs = require('fs');

var acorn = require('acorn');
var astring = require('astring');

var instrument = require('./instrument.js');

var originalWrap = Module.wrap;

var cjsArguments = ['exports', 'require', 'module', '__dirname', '__filename'];

function noop() {}

function callWithLya(instrumentation) {
  Module.wrap = bindModuleWrapOverride(instrumentation);

  try {
    var result = instrumentation.onReady();
    Module.wrap = originalWrap;
    return result;
  } catch (error) {
    Module.wrap = originalWrap;
    throw error;
  }
}

function bindModuleWrapOverride(instrumentation) {
  return function wrap(script) {
    // User gets first dibs on the original code. They may also return
    // per-module instrumentation for outlier programs.
    var fallback = { script: script, instrumentation: instrumentation };
    function returnFallback() { return fallback }
    var planModuleRewrite = instrumentation.onModuleWrap || returnFallback;
    var moduleSpecific = planModuleRewrite({
      script: script,
      acorn: acorn,
      astring: astring,
      instrumentation: instrumentation,
    }) || fallback;

    // Shebangs may break parsers, but we don't want to remove them.
    var commentedOutShebang = moduleSpecific.script.replace(/^\s*#!/, '//#!');
    var analysisReady = rewriteModule(commentedOutShebang, moduleSpecific.instrumentation);

    // Allow user to react to rewrites
    var afterModuleRewrite = moduleSpecific.instrumentation.afterModuleRewrite || noop;
    afterModuleRewrite({ script: analysisReady });

    return analysisReady;
  }
}


function rewriteModule(script, instrumentation) {
  var ast = acorn.parse(script, Object.assign({
    sourceType: 'script',
    ecmaVersion: 2020,
  }, instrumentation.acornConfig || {}));
  
  // Declare a shallow clone of the instrumentation as a
  // non-collidable global to preserve own properties per-module.
  var instId = generateIdentifier();
  var rewritten = instrument.instrumentCode(ast, instId, instrumentation);
  global[instId] = Object.assign({}, instrumentation);

  // Move the user's CommonJS where instrumentation is visible.
  var userCjsExpr = originalWrap(rewritten).replace(/;$/, '');
  var userCjsCall = makeCallExpression(userCjsExpr, cjsArguments);
  var equipExpr = '(function (' + instId + '){return ' + userCjsCall + '})';

  // Inject code to move instrumentation out of global scope.
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


// We need non-collidable identifiers to mitigate the risk of input
// code that tries to sabotage an analysis.
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

if (require.main === module) {
  var entry = process.argv[2];

  if (!entry || !fs.existsSync(entry)) {
    console.log('Expected existing Node.js module file. Got', entry);
    process.exit(1);
  }

  callWithLya(require(path.resolve(process.cwd(), entry))(process.argv.slice(2)));
}
