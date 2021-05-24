module.exports = function importAnalysis(argv, lya) {
  const results = {};

  return {
    onReady: function onReady () {
      return require(lya.findEntryModule(require, argv[0]));
    },

    onCallExpression: function onCallExpression(original, info) {
      const result = original();

      var I = info.instrumentation;

      // "Did a module call its own require function?"
      if (I.require === info.target) {
        results[I.module.id] = results[I.module.id] || [];
        results[I.module.id].push(info.args[0]);
      }
      
      return result;
    },
    afterAnalysis: function afterAnalysis() {
      return JSON.stringify(results, null, 2);
    },
  };
};
