let env;
const result = {};
const fs = require('fs');

const onImport = (info) => {
  console.log('lya:', info.caller, 'imports', info.callee, info.name);
  if (!result[info.caller]) {
    result[info.caller] = [];
  }
  result[info.caller].push(info.callee);
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
