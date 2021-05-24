var acorn = require('acorn');
var astring = require('astring');

module.exports = {
  makeCallWithLyaInput,
  makeRewriteModuleInput,
};

function identity(v) { return v }
function defaultApply(f) { return f() }

function makeCallWithLyaInput(callWithLyaInput) {
  return Object.assign({
    acornConfig: {
      sourceType: 'script',
      ecmaVersion: 2020,
    },
    afterAnalysis: identity,
    afterRewriteModule: function afterRewriteModule(v) {
      return v.script
    },
    onModuleWrap: identity,
    onCommonJsApply: defaultApply,
    onHook: defaultApply,
    onError: function onError(e) {
      throw e;
    },
    onReady: function onReady() {
      throw new Error('onReady not defined');
    },
  }, callWithLyaInput || {});
}

function makeRewriteModuleInput(userCallWithLyaInput, script) {
  return {
    acorn: acorn,
    astring: astring,
    script: script,
    callWithLyaInput: makeCallWithLyaInput(userCallWithLyaInput),
  };
}
