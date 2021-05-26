var crypto = require('crypto');
module.exports = function callAnalysis(argv, lya) {
  // Function => Array of { stack, module }, s.t. `stack` represents
  // stack trace at the time, and `module` lexically holds the call.
  var counts = new Map();

  return {
    onReady: function onReady() {
      return require(lya.findEntryModule(require, argv[0]));
    },

    onCallExpression: function onCallExpression(f, opts) {
      var target = opts.target, I = opts.I, module = I.module;
      if (!counts.has(target)) counts.set(target, []);

      // Make anonymous functions content-addressable.
      target.name = target.name || (
        '_' + crypto.createHash('sha256').update(target.toString(), 'utf8').digest('hex')
      );

      // Tracking call with function and module 
      counts.get(target).push({ module: module, stack: (new Error()).stack });

      return f();
    },
      
    refactorCallExpression: function refactorCallExpression(R) {
      return R.wrap(R.render(R.node), {
        addReturn: true,
        injectProperties: { target: R.render(R.node.callee) },
      });
    },
    
    // List calls in alphabetical order with count and trace info
    afterAnalysis: function afterAnalysis() {
      console.log(JSON.stringify(
        Array.from(counts)
             .sort(function (a,b) { return a[0].name.localeCompare(b[0].name) })
             .map(function (data) {
               return {
                 name: data[0].name,
                 calls: data[1].length,
                 moduleAppearances: Array.from(new Set(data[1].map(({module:m}) => m.id))),
                 traces: data[1].map(({stack}) => stack.split('\n').slice(1, -2).map((l) => l.replace(/^\s+at /, ''))),
               }}), null, 2));
    },
  };
}
