module.exports = {
  instrumentCode,
};

var astring = require('astring');

function instrumentCode(ast, instrumentationIdentifier, config) {
  return gen(ast, bindGenerator(instrumentationIdentifier, config));
}

function gen(ast, generator = astring.GENERATOR) {
  return astring.generate(ast, {
    generator: (
      generator === astring.GENERATOR
        ? astring.GENERATOR
        : Object.assign({}, astring.GENERATOR, generator)),
  });
}

function bindGenerator(instrumentationIdentifier) {
  var hook = installHook.bind(null, instrumentationIdentifier);

  return {
    CallExpression: function CallExpression(node, state) {
      state.write(hook(node, 'onApply', {
        target: gen(node.callee),
        args: '[' + node.arguments.map((n) => gen(n)).join(',') + ']',
      }));
    },
    AssignmentExpression: function AssignmentExpression(node, state) {
      const { operator, left, right } = node;
      const lhs = gen(left);
      const rhs = gen(right);

      state.write(hook(node, 'onWrite', {
        operator,
        lhs: lhs,
        rhs: rhs,
      }));
    }
  };
}

function wrapInFunction(node) {
  return 'function () {return ' + gen(node) + '}';
}

function installHook(instrumentationIdentifier, node, hookName, opts) {
  var propertyDeclarations = (
    Object
      .keys(opts)
      .reduce((props, name) =>
              (props.push(name + ':' + opts[name]), props), [])
  );

  opts.module = 'module';

  var properties = '{' + propertyDeclarations.join(',') + '}';
  var subscript = "['" + hookName + "']";
  var wrapped = wrapInFunction(node);
  var hookArguments = '(' + wrapped + ',' + properties + ')';

  return instrumentationIdentifier + subscript + hookArguments;
}
