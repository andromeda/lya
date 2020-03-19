#!/bin/bash

set -e

for d in t*/; do
  cd $d;
  java -jar ../../mir-sa.jar . | grep "^{" | jq .  > RWX.static.json
  node -e 'var eq = require("lodash.isequal"); var c = require("./RWX.correct.json"); var d = require("./RWX.static.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }'
  cd ..
done
