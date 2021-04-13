const { configureLya } = require('../../config.js');
const hook = n => (...a) => console.log('lya:', n, '\n', ...a, '\n\n');

module.exports = (lya) =>
  lya.createLyaState({
    hooks: (
      Object
        .keys(configureLya({}).hooks)
        .reduce((hooks, name) =>
                (hooks[name] = hook(name), hooks), {})),
  });
