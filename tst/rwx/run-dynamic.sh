#!/bin/bash

set -o pipefail
set -e

analysis() {
  # Dynamic analysis comes from a different segment so that
  # static analysis does not get confused
  cat correct.pwd.json | sed "s;PWD_REPLACE;$(pwd);" > correct.json
  cat ../prologue-rwx.lya ../epilogue.lya > generated.test
  # Replace node with cat to see the generated script
  node generated.test > /dev/null
  # run main and compare results with static
  # node -e 'require("assert").deepStrictEqual(require("./dynamic.json"), require("./correct.json"));'
  node -e 'var eq = require("lodash.isequal"); var c = require("./correct.json"); var d = require("./dynamic.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }' | nl
}

if [ "$#" -eq 1 ]; then
  cd $1
  analysis
  cd ..
else
  for d in t?/ t??/; do
    cd $d;
    analysis
    cd ..
  done
fi

