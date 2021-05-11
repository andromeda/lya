#! /usr/bin/env node

const { callWithModuleOverride } = require('./instrument.js');

module.exports = {
  callWithLya,
};

function callWithLya(hook, f) {
  try {
    hook({ type: 'start', time: process.hrtime() });

    const result = callWithModuleOverride(hook, f);

    hook({ type: 'end', time: process.hrtime() });

    return result;
  } catch (error) {
    hook({type: 'error', error});
    throw error;
  }
}

if (require.main === module) {
  const path = require('path');

  callWithLya((v) => console.log(JSON.stringify(v, null, 2)),
              () => require(path.resolve(process.cwd(), process.argv[2])));
}
