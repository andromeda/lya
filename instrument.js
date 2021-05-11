module.exports = {
  callWithModuleOverride,
};

const Module = require('module');

const acorn = require('acorn');
const astring = require('astring');

const originalWrap = Module.wrap;

function callWithModuleOverride(hook, f) {
  Module.wrap = bindModuleWrapOverride(hook);

  try {
    const result = f();

    Module.wrap = originalWrap;

    return result;
  } catch (error) {
    Module.wrap = originalWrap;

    throw error;
  }
}

function bindModuleWrapOverride(hook) {
  return function rewriteCommonJsSource(script) {
    const commentedOutShebang = script.replace(/^\s*#!/, '//#!');
    const wrapped = originalWrap(commentedOutShebang);
    const ast = acorn.parse(wrapped.replace(/;$/, ''), {
      sourceType: 'script',
      ecmaVersion: 2020,
    });

    hook({ type: 'source', ast, script });

    return astring.generate(ast, { generator }) + ';';
  }
}


const generator = Object.assign({}, astring.GENERATOR, {
});
