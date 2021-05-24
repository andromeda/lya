module.exports = function (argv, lya) {
  return {
    onReady: function onReady () {
      return require(lya.findEntryModule(require, argv[0]));
    },
    afterRewriteModule: function afterModuleRewrite(i) {
      console.log(i.script);
      return i.script;
    }
  };
}
