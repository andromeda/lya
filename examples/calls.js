var crypto = require('crypto');

module.exports = function callAnalysis(argv, lya) {
  // Key: Function
  // Value: Array of { stack, module }
  //
  // Premise: Array represents individual calls, `stack` represents
  // stack trace at the time, and `module` represents the Module
  // lexically containing the call.
  //
  // Therefore, the length of the array is the # of calls, and the
  // data tells you where the calls appear.
  const counts = new Map();

  return {
    onReady: function onReady() {
      return require(lya.findEntryModule(require, argv[0]));
    },

    onCallExpression: function onCallExpression(f, { target, instrumentation: { module } }) {
      if (!counts.has(target))
        counts.set(target, []);

      // Anonymous functions with consistent source code are
      // content-addressable.
      target.name = target.name || (
        '_' + crypto.createHash('sha256').update(target.toString(), 'utf8').digest('hex')
      );

      // Tracking call with function and module 
      counts.get(target).push({
        stack: (new Error()).stack,
        module,
      });

      return f();
    },

    refactorCallExpression: function refactorCallExpression(R) {
      return R.wrap(R.render(R.node), {
        target: R.render(R.node.callee),
      });
    },

    
    // Create JSON Array output where functions are listed in
    // alphabetical order (.sort()). Show how many times each function
    // was called, along with where the function call appeared.
    afterAnalysis: function afterAnalysis() {
      return JSON.stringify(
        Array
          .from(counts)
          .sort(([a],[b]) => a.name.localeCompare(b.name))
          .map(([fn, meta]) => ({
            name: fn.name,
            calls: meta.length,
            moduleAppearances: Array.from(new Set(meta.map(({module:m}) => m.id))),
            traces: meta.map(({stack}) =>
                             stack
                             .split('\n')
                             .slice(1, -2)
                             .map((l) => l.replace(/^\s+at /, ''))),
          })), null, 2)
    },
  };
}
