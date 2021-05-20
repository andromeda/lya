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
  injectHook,
  instrumentCode,
  equipAssignmentExpression,
  equipCallExpression,
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

function injectHook(userOptions) {
  var options = (typeof userOptions === 'object' && userOptions !== null) ? userOptions : {};
  var isExpression = options.isExpression || true;
  var instrumentationId = requireKey(options, 'instrumentationId');
  var node = requireKey(options, 'node');
  var hookName = requireKey(options, 'hookName');
  var injectProperties = Object.assign({}, options.injectProperties || {});

  // The properties defined here appear with their runtime values when
  // the hook actually fires. We always want to expose the
  // instrumentation and the ESTree for the operation, because that
  // allows a hook to make decisions based on static information,
  // dynamic information, AND per-module configuration.
  injectProperties.instrumentation = instrumentationId;
  injectProperties.estree = JSON.stringify(node, function (key, value) {
    return (key === 'start' || key === 'end') ? undefined : value;
  });

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
  var deferred = 'function () {' + (isExpression ? 'return ' : '') + gen(node) + '}';
  var hookArguments = '(' + deferred + ',' + properties + ')';

  // This appears in code as a CallExpression like this
  /*
    __lya8323['onApply'](function () {return console.log(1)}, {
      <whatever was in injectProperties>
      instrumentation: __lya8323,
      estree: { "type": "CallExpression", ... },
    });

    where
      - `instrumentationId` is `__lya8323`
      - `subscript` is ['onApply'], and
      - `hookArguments` is the remaining parenthetical.
  */
  return instrumentationId + subscript + hookArguments;
}

function requireKey(o, key) {
  if (key in o) return o[key];
  throw new Error('Missing ' + key);
}


// bindGenerator returns an astring generator interface, which
// controls how an ESTree turns to ECMAScript source code. We base the
// transformations on the identifier used for the instrumentation
// object, and generate the full interface from the `equip*`
// functions in the module.

function bindGenerator(instrumentationId, instrumentation) {
  var hooksToEquipFunctions = [
    ['onApply', equipCallExpression],
    ['onWrite', equipAssignmentExpression],
  ];

  return hooksToEquipFunctions.reduce(function (iface, pair) {
    var hookName = pair[0];
    var equip = pair[1];
    var esTreeNodeType = equip.name.replace('equip', '');

    // Only rewrite code if there's a hook to call.
    if (typeof instrumentation[hookName] === 'function')  {
      iface[esTreeNodeType] = bindInjectionSite(
        instrumentationId, instrumentation, hookName, equip);
    }

    return iface;
  }, {})
}


// Return a function used to extend astring to print a particular
// ESTree as valid ECMAScript. In the context of Lya, the returned
// function injects a hook call against the instrumentation.
function bindInjectionSite(instrumentationId, instrumentation, hookName, equip) {
  return function (node, state) {
    var options = equip(node);
    options.instrumentationId = instrumentationId;
    options.instrumentation = instrumentation;
    options.node = node;
    options.hookName = hookName;
    options.isExpression = /Expression/.test(node.type);
    return state.write(injectHook(options));
  };
}


////////////////////////////////////////////////////////////////////////////////
// The `equip*` functions are defined as `ESTree -> Object`, making
// them easier to test.  They each return part of an object used as an
// argument for `injectHook`.

function equipCallExpression(node) {
  return {
    injectProperties: {
      target: gen(node.callee),
      args: '[' + node.arguments.map((n) => gen(n)).join(',') + ']',
    },
  };
}

function equipAssignmentExpression(node) {
  var lhs = gen(node.left);

  // An assignment might create a new global variable.  One way to
  // check if that is going to happen is by detecting if an
  // injected access fails. That allows us to "warn" the hook that
  // a new global is incoming.
  //
  // This only works for unprefixed global assignments.
  var isReference = (
    '(function () {try{' + lhs + ';return false}' +
    'catch(e){return e instanceof ReferenceError }})()'
  );

  return {
    injectProperties: {
      operator: node.operator,
      isUnprefixedGlobalDeclaration: isReference,
      value: gen(node.right),
    },
  };
}
