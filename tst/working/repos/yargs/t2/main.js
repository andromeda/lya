lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 1,
};
let lya = require("../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

require('yargs') // eslint-disable-line
  .command('serve [port]', 'start the server', (yargs) => {
    yargs
      .positional('port', {
        describe: 'port to bind on',
        default: 5000
      })
  }, (argv) => {
    if (argv.verbose) console.info(`start server on :${argv.port}`)
    serve(argv.port)
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .argv
