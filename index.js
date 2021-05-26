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

var originalWrap = Module.wrap.bind(Module);
var cjsArguments = ['exports', 'require', 'module', '__dirname', '__filename'];

// Parameterizations must be module-level so that they are shared
// across all hooks.
var params = {};

const processOn = process.on.bind(process);
const processRemoveListener = process.removeListener.bind(process);


// This injectable code must appear in a CommonJS module to work.
var extractIntrumentationCode = minify(function x(id, next) {
  var I = global[id];

  // Prevent checking the global object for instrumentation.
  delete global[id];

  // For dodging shadows and surprising reassignments.
  I.global = (new Function('return this'))();
  I.module = module;
  I.exports = exports;
  I.require = require;
  I.__dirname = __dirname;
  I.__filename = __filename;

  return next(I, I.rewriteModuleInput.callWithLyaInput);
}.toString());

if (require.main === module) {
  var entry = findEntryModule(require, process.argv[2]);
  var analysis = require(entry);
  var callWithLyaInput = analysis(process.argv.slice(3), module.exports);
  callWithLya(callWithLyaInput);
}


function callWithLya(userCallWithLyaInput) {
  var callWithLyaInput = makeCallWithLyaInput(userCallWithLyaInput);
  var forcedExit = true;
  function exit(v) {if (forcedExit) callWithLyaInput.onForcedExit(v)}
  function beforeExit(v) {forcedExit = false}

  Module.wrap = bindModuleWrapOverride(callWithLyaInput);
  processOn('beforeExit', beforeExit)
  processOn('exit', exit);

  function cleanup() {
    Module.wrap = originalWrap;
    processRemoveListener('beforeExit', beforeExit);
    processRemoveListener('exit', exit);
  }

  try {
    var result = callWithLyaInput.onReady();
    return callWithLyaInput.afterAnalysis(result);
  } catch (error) {
    Module.wrap = originalWrap;
    processRemoveListener('exit', exit);
    return callWithLyaInput.onError(error);
  }
}


// Data type constructors

function identity(v) { return v }
function defaultApply(f) { return f() }
function noop() {}

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
    onForcedExit: noop,
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


function bindModuleWrapOverride(callWithLyaInput) {
  return function wrap(script) {
    // User gets first dibs, and may override behavior for the module.
    var rewriteModuleInput = makeRewriteModuleInput(callWithLyaInput, script);
    var cwli = rewriteModuleInput.callWithLyaInput;

    rewriteModuleInput = cwli.onModuleWrap(rewriteModuleInput) || rewriteModuleInput;

    // Shebangs may break parsers, but we don't want to remove them.
    rewriteModuleInput.script = rewriteModuleInput.script.replace(/^\s*#!/, '//#!');
    rewriteModuleInput.script = rewriteModule(rewriteModuleInput);

    // Allow user to react to rewrites
    return cwli.afterRewriteModule(rewriteModuleInput);
  }
}

function rewriteModule(rewriteModuleInput) {
  var ast = rewriteModuleInput.acorn.parse(
    rewriteModuleInput.script,
    rewriteModuleInput.callWithLyaInput.acornConfig);

  // A non-collidable global helps preserve own properties.
  var instId = generateIdentifier();
  var instrumentation = { rewriteModuleInput: rewriteModuleInput };
  var rewritten = instrumentCode(ast, instId, instrumentation);
  global[instId] = instrumentation;

  // Move the user's CommonJS where instrumentation is visible.
  var userCjsExpr = originalWrap(rewritten).replace(/;$/, '');
  var userCjsCall = makeCallExpression(userCjsExpr, cjsArguments);
  var hookedCjsCall = makeCallExpression(
    instId + "_h['onCommonJsApply']",
    ['function () { return ' + userCjsCall + '}',
     instId]);
  var equipExpr = '(function (' + instId + ', ' + instId + '_h){return ' + hookedCjsCall + '})';

  // Inject transfer from global scope to function scope.
  var recvIIFE = '(' + extractIntrumentationCode + ')("' + instId + '",' + equipExpr + ')';

  // A second wrap gives Lya control over the transition from the
  // beginning of the CommonJS module, to user code. It also
  // provides correct bindings for `extractIntrumentationCode`.
  return originalWrap(recvIIFE);
}


// Non-collidable identifiers handles some cases of input code that
// tries to sabotage an analysis, but this alone does not make such an
// attack infeasible.
function generateIdentifier() {
  return '__lya' + crypto.randomBytes(4).toString('hex');
}

function makeCallExpression(fexpr, args = []) {
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


function instrumentCode(ast, instrumentationId, instrumentation) {
  return gen(ast, bindGenerator(instrumentationId, instrumentation));
}


// Use as shorthand notation for recursively generating JavaScript
// from a parse tree.
function gen(ast, generator = astring.GENERATOR) {
  return astring.generate(ast, {
    generator: (
      generator === astring.GENERATOR
        ? astring.GENERATOR
        : Object.assign({}, astring.GENERATOR, generator)),
  });
}


// This function generates code for firing a hook in advance of other
// code. This is dangerous if the hooks come from untrusted code.
function bindHookWrapper(instrumentationId, node, hookName) {
  return function (source, userOptions) {
    var options = userOptions || {};
    var addReturn = options.addReturn || true;
    var useHook = options.hookName || hookName;
    var injectProperties = options.injectProperties || {};

    // Send all info down to hook.
    injectProperties.I = instrumentationId;

    var propertyDeclarations = (
      Object
        .keys(injectProperties)
        .reduce(function (props, name) {
          props.push(name + ':' + injectProperties[name]);
          return props;
        }, [])
    );

    var properties = '{' + propertyDeclarations.join(',') + '}';
    var subscript = "['" + useHook + "']";
    var deferred = 'function () {' + (addReturn ? 'return ' : '') + source  + '}';
    var hookArguments = '(' + deferred + ',' + properties + ')';

    // This appears in code as a CallExpression like this
    /*
      __lya8323_h['onCallExpression'](function () {return console.log(1)}, {
      <whatever was in injectProperties>
      instrumentation: __lya8323,
      estree: { "type": "CallExpression", ... },
      });

      where
      - `instrumentationId` is `__lya8323`
      - `subscript` is ['onCallExpression'], and
      - `hookArguments` is the remaining parenthetical.
    */
    return instrumentationId + '_h' + subscript + hookArguments;
  }
}


// Returns an astring generator interface to control how an ESTree
// turns to ECMAScript code.
function bindGenerator(instrumentationId, instrumentation) {
  return Object.keys(astring.GENERATOR).reduce(function (iface, esNodeType) {
    var refactorName = 'refactor' + esNodeType;
    var hookName = 'on' + esNodeType;
    var hooks = instrumentation.rewriteModuleInput.callWithLyaInput;

    // Set default implementation
    iface[esNodeType] = astring.GENERATOR[esNodeType];

    // Hook defined? Rewrite the code to inject a call.
    if (hooks[refactorName] || hooks[hookName]) {
      iface[esNodeType] = function (node, state) {
        var options = {
          instrumentationId: instrumentationId,
          instrumentation: instrumentation,
          node: node,
          hookName: hookName,
          wrap: bindHookWrapper(instrumentationId, node, hookName),
          params: params,
          instrument: function instrument(n, nparams = params) {
            if (n === node) {
              throw new Error('Cycle detected. Do not call instrument() on the node that came with it.');
            }

            if (typeof nparams !== 'object' || nparams === null) {
              throw new Error('Non-object passed as second argument of instrument()');
            }

            // Update parameterization
            var old = params;
            params = nparams;
            var output = gen(n, iface);
            params = old;

            return output;
          },
          render: gen,
        };

        var refactor = hooks[refactorName] || function refactor() {
          return options.wrap(gen(node));
        };

        var code = refactor(options);

        if (!code && code !== '') {
          return astring.GENERATOR[esNodeType](node, state);
        } else {
          return state.write(code);
        }
      }
    }

    return iface;
  }, {})
}
