var acorn = require('acorn');
var astring = require('astring');

module.exports = {
  makeCallWithLyaInput,
  makeRewriteModuleInput,
};

function identity(v) { return v }
function defaultApply(f) { return f() }

function makeCallWithLyaInput(callWithLyaInput) {
  var cwli = callWithLyaInput || {};
  
  return {
    acornConfig: cwli.acornConfig || {
      sourceType: 'script',
      ecmaVersion: 2020,
    },
    afterAnalysis: cwli.afterAnalysis || identity,
    afterRewriteModule: cwli.afterRewriteModule || function afterRewriteModule(v) { return v.script },
    onModuleWrap: cwli.onModuleWrap || identity,
    onCommonJsApply: cwli.onCommonJsApply || defaultApply,
    onCallExpression: cwli.onCallExpression || defaultApply,
    onHook: cwli.onHook || defaultApply,
    onWrite: cwli.onWrite,
    onError: cwli.onError || function onError(e) {
      throw e;
    },
    onReady: cwli.onReady || function onReady() {
      throw new Error('onReady not defined');
    },
  };
}

function makeRewriteModuleInput(userCallWithLyaInput, script) {
  return {
    acorn: acorn,
    astring: astring,
    script: script,
    callWithLyaInput: makeCallWithLyaInput(userCallWithLyaInput),
  };
}
