// At a high level, instrumenting a CommonJS module means injecting
// interactions with an instrumentation object.  This module handles
// code rewrites to that effect by extending `astring`.
//
// Specifically, this module equips individual ECMAScript expressions
// and statements. "Equipping" means doing just enough static analysis
// on the code to make dynamic analysis less of a guessing game, and
// then passing along the parse tree to the runtime for a hook to see.
// This makes hooks powerful, because they can analyze JS code across
// phases with some common questions already answered.
//
// See https://github.com/davidbonnet/astring#extending

module.exports = {
  gen,
  instrumentCode,
};

var astring = require('astring');

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
  return function (source, injectProperties) {
    injectProperties = injectProperties || {};

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
    var subscript = "['" + hookName + "']";
    var deferred = 'function () {' + source + '}';
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
    if (hooks[hookName]) {
      iface[esNodeType] = function (node, state) {
        var options = {
          instrumentationId: instrumentationId,
          instrumentation: instrumentation,
          node: node,
          hookName: hookName,
          wrap: bindHookWrapper(instrumentationId, node, hookName),
          instrument: function instrument(n) {
            if (n === node) {
              throw new Error('Cycle detected. Do not call instrument() on the node that came with it.');
            }
            return gen(n, iface);
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
