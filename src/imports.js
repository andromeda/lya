let env;
const result = {};
const fs = require('fs');

const onImport = (caller, callee, name) => {
  console.log('lya:', caller, 'imports', callee, name);
  if (!result[caller]) {
    result[caller] = [];
  }
  result[caller].push(callee);
};

const onExit = () => {
  if (env.conf.SAVE_RESULTS) {
    fs.writeFileSync(env.conf.SAVE_RESULTS,
        JSON.stringify(result, null, 2), 'utf-8');
  }
};

module.exports = (e) => {
  env = e;
  return {
    onImport: onImport,
    onExit: onExit,
  };
};
