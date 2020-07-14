#!/bin/bash

set -o pipefail
set -e

analysis() {
  # Dynamic analysis comes from a different segment so that
  # static analysis does not get confusedi
  cat correct.pwd.json | sed "s;PWD_REPLACE;$(pwd);" > correct.json
  cat ../prologue-profiling.lya ../epilogue.lya > generated.test
  # Replace node with cat to see the generated script
  node generated.test > /dev/null
  #FIXME: fix the next 3 lines
  cp ../correctness.js ./
  node correctness.js
  rm correctness.js
  # run main and compare results with static
  # node -e 'require("assert").deepStrictEqual(require("./dynamic.json"), require("./correct.json"));'
  #node -e 'var eq = require("lodash.isequal"); var c = require("./correct.json"); var d = require("./dynamic.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }' | nl
}

if [ "$#" -eq 1 ]; then
  cd $1
  analysis $1
  cd ..
else
  for d in t?/; do
    cd $d;
    analysis $d
    cd ..
  done
fi

