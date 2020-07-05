### Refactoring

* fix test cases
* refactor

Quantum vs. non-quantum / symmetric vs. symmetric

### Cases

Test the following cases:

```JavaScript
R: module.parent
R: module.exports 
X: Array.of
X: n.toString()
RW:Number.prototype.toExponential   Number.prototype.toFixed         Number.prototype.toPrecision

except: ["/onetwo/"]
```

Static analysis:
```
t11 reverse stuff
```

### New `lya` Interface

Changed how users specify analyses. This requires several changes in the tests, taken by running `find ./tst -name '*.js' | xargs grep analysisCh` at the top level:

```
./tst/repos/moment/main.js:	analysisCh: parseInt(process.env.key),
./tst/repos/classnames/test/bind.js:	analysisCh: parseInt(process.env.npm_config_key),
./tst/repos/minimist/short/short.js:  analysisCh: parseInt(process.env.key),
./tst/repos/minimist/long/long.js:  analysisCh: parseInt(process.env.key),
./tst/repos/minimist/whitespace/whitespace.js:	analysisCh: parseInt(process.env.key),
./tst/repos/minimist/dotted/dotted.js:  analysisCh: parseInt(process.env.key),
./tst/repos/minimist/stop_early/stop_early.js:  analysisCh: parseInt(process.env.key),
./tst/repos/chalk/test/chalk.js:	analysisCh: parseInt(process.env.npm_config_key),
./tst/repos/yargs/test/yargs.js:  analysisCh: parseInt(process.env.npm_config_key),
./tst/repos/colorette/test/index.js:  analysisCh: parseInt(process.env.npm_config_key),
./tst/repos/colorette/lya/txfm.js:let userChoice = (lyaConfig.analysisCh && [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(lyaConfig.analysisCh))? lyaConfig.analysisCh : 1
./tst/repos/mkdirp/test/chmod.js:	analysisCh: parseInt(process.env.npm_config_key),
./tst/repos/mkdirp/repo/test/chmod.js:	analysisCh: parseInt(process.env.npm_config_key),
./tst/repos/debug/test.js:	analysisCh: parseInt(process.env.npm_config_key),
./tst/synthetic/t11/main.js:analysisCh: 1,
./tst/synthetic/t10/main.js:analysisCh: 6,
./tst/synthetic/t5/main.js:        analysisCh: parseInt(process.env.key),
./tst/synthetic/t2/main.js:        analysisCh: parseInt(process.env.key),
./tst/synthetic/t3/main.js:        analysisCh: parseInt(process.env.key),
./tst/synthetic/t4/main.js:        analysisCh: parseInt(process.env.key),
./tst/synthetic/t12/main.js:analysisCh: 6,
./tst/synthetic/t13/main.js:analysisCh: 6,
./tst/synthetic/t1/main.js:        analysisCh: parseInt(process.env.key),
./tst/synthetic/t6/main.js:        analysisCh: parseInt(process.env.key),
./tst/synthetic/t8/main.js:        analysisCh: parseInt(process.env.key),
./tst/synthetic/t9/simpleMain.js:    analysisCh: 12,
./tst/synthetic/t9/main.js:        analysisCh: parseInt(process.env.key),
./tst/synthetic/t7/main.js:        analysisCh: parseInt(process.env.key),
./tst/RWX/t9/simpleMain.js:    analysisCh: 12,
```


### Things to fix
- Make lya run on node 12+
- Fix let ~> var or with source transformation


