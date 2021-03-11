const fs = require('fs');
const path = require('path');
const Module = require('module');
const lya = require('@andromeda/lya');


let env;

const inc = (moduleName, fnName) => {
    const res = env.analysisResult;

    if (!res[moduleName]) {
        res[moduleName] = {};
    }

    res[moduleName][fnName] = (res[moduleName][fnName] || 0) + 1;
};

const onExit = (intersection, candidateModule) => {
  for (const name of intersection) {
    const currentName = candidateModule.get(name);
    inc(currentName, name);
  }

  const json = JSON.stringify(env.analysisResult, null, 2);

  if (env.conf.SAVE_RESULTS) {
    fs.writeFileSync(env.conf.SAVE_RESULTS, json, 'utf-8');
  }

  if (env.conf.print) {
      console.log(json);
  }
};

const onCallPre = (info) => {
    inc(info.currentModule, info.nameToStore);

    // FIXME: The function name can be spoofed, but
    // `info.target === eval` is `false` when it should be `true`.
    // Maybe support a `info.target.originalReference`?
    if (info.target.name === 'eval') {
        const generated = path.resolve('_code.js');
        fs.writeFileSync(generated, info.argumentsList[0], { flag: 'w' });
        // Use this instead when using a Node version that supports it.
        // const R = Module.createRequire(info.currentModule);
        return () => lya.configRequire(require, { conf: __filename })(generated);
    }
};

module.exports = (e) => {
    env = e;

    return { onCallPre, onExit };
}
