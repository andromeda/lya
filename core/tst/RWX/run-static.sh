#!/bin/bash

set -o pipefail
set -e

# Note that this is either absolute or relative to `t*/.` !
MIR_SA=${MIR_PATH:-~/wrk/andromeda/mir/static-analysis/mir-sa.jar}

analysis() {
  cat correct.pwd.json | sed "s;PWD_REPLACE;$(pwd);" > correct.json
  java -jar $MIR_SA . | grep "^{" | jq .  > static.json
  node -e 'var eq = require("lodash.isequal"); var c = require("./correct.json"); var d = require("./static.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }' | nl
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

