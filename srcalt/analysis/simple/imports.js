let env;
const result = {};
const fs = require('fs');

const onImport = (info) => {
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
  if (env.conf.print) {
    console.log(JSON.stringify(result, null, 2));
  }
};

module.exports = (e) => {
  env = e;
  return {
    onImport: onImport,
    onExit: onExit,
  };
};
