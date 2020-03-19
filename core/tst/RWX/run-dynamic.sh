#!/bin/bash

set -e

for d in t*/; do
  cd $d;
  ./run.sh
  # run main and compare results with static
  # node -e 'require("assert").deepStrictEqual(require("./RWX.dynamic.json"), require("./RWX.correct.json"));'
  node -e 'var eq = require("lodash.isequal"); var c = require("./RWX.correct.json"); var d = require("./RWX.dynamic.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }'
  cd ..
done
