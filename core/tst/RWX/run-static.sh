#!/bin/bash

set -e

analysis() {
  cat correct.pwd.json | sed "s;PWD_REPLACE;$(pwd);" > correct.json
  java -jar ../../../mir-sa.jar . | grep "^{" | jq .  > static.json
  node -e 'var eq = require("lodash.isequal"); var c = require("./correct.json"); var d = require("./static.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }'
}

if [ "$#" -eq 1 ]; then
  cd $1
  analysis
  cd ..
else
  for d in t*/; do
    cd $d;
    analysis
    cd ..
  done
fi

