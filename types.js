module.exports = {
  makeCallWithLyaInput,
  makeRewriteModuleInput,
};

function identity(v) { return v }

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
    onApply: cwli.onApply,
    onHook: cwli.onHook || function onHook(f) { return f() },
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
  var cwli = makeCallWithLyaInput(userCallWithLyaInput);

  return {
    afterRewriteModule: cwli.afterRewriteModule,
    script: script,
    acornConfig: cwli.acornConfig,
    onApply: cwli.onApply,
    onHook: cwli.onHook,
    onWrite: cwli.onWrite,
  };
}
