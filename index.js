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

function noop() {}

function callWithLya(config) {
  Module.wrap = bindModuleWrapOverride(config);

  try {
    var result = config.onReady();
    Module.wrap = originalWrap;
    return result;
  } catch (error) {
    Module.wrap = originalWrap;
    throw error;
  }
}

function bindModuleWrapOverride(config) {
  return function rewriteCommonJsSource(script) {
    // User gets first dibs so that won't see instrumentation. They
    // may also return per-module configuration for outlier programs.
    function keepScript(c) { return c.script }
    var userOverride = (config.onModuleWrap || keepScript)({
      script: script,
      acorn: acorn,
      astring: astring,
      config: config
    }) || config;

    var userScript = userOverride.script || script;
    var newConfig = userOverride.config || config;

    // Shebangs will break parsers, but we don't want to hide them.
    var commentedOutShebang = userScript.replace(/^\s*#!/, '//#!');
    var analysisReady = rewriteModule(commentedOutShebang, newConfig);

    // Useful in case the code breaks from a rewrite and we want to
    // see why, or throw an error to prevent execution.
    (newConfig.onModuleRewrite || noop)({ script: analysisReady });

    return analysisReady;
  }
}

function rewriteModule(script, config) {
  // For binding in generated code with a low risk of collision.
  var empiricallyUniqueIdentifier = `__lya${crypto.randomBytes(8).toString('hex')}`;

  var ast = acorn.parse(script, Object.assign({
    sourceType: 'script',
    ecmaVersion: 2020,
  }, config.acornConfig || {}));

  var rewritten = instrument.instrumentCode(
    ast, empiricallyUniqueIdentifier, config);

  // We put config in the global object to share with our modules, but
  // the module needs hide the reference from user code.
  global[empiricallyUniqueIdentifier] = config;

  var moveGlobal = (function extractInstrumentation(id) {
    var g = global[id];
    delete global[id];
    return g;
  }).toString();

  var cjsExpression = originalWrap(rewritten).replace(/;$/, '');
  var injectInstrumentation = [
    '(function (' + empiricallyUniqueIdentifier + ') {',
    'return ' + cjsExpression + '(module, exports, require, __dirname, __filename);',
    '})(' + moveGlobal + '("' + empiricallyUniqueIdentifier + '"))',
  ].join('');

  // A second wrap ensures that Lya controls the transition from the
  // beginning of the CommonJS module, to the beginning of the user's
  // code.
  return originalWrap(injectInstrumentation);
}

if (require.main === module) {
  var entry = process.argv[2];

  if (!entry || !fs.existsSync(entry)) {
    console.log('Expected existing Node.js module file. Got', entry);
    process.exit(1);
  }

  callWithLya(require(path.resolve(process.cwd(), entry)));
}
