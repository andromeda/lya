#!/bin/bash

MIR_SA=${MIR_PATH:-~/wrk/andromeda/mir/static-analysis/mir-sa.jar}
GROUND_TRUTH="${GROUND_TRUTH:-static}" # ground truth can be: static, dynamic, correct

analysis() {
  # Dynamic analysis comes from a different segment so that
  # static analysis does not get confused
  t="$(echo $1 | sed 's;/;;' | sed 's;$;:;')"
  cat correct.pwd.json | sed "s;PWD_REPLACE;$(pwd);" > correct.json

  # generate static
  java -jar $MIR_SA . | grep "^{" | jq .  > static.json
  # java -Dmaybe.reaching=true -jar $MIR_SA . | grep "^{" | jq .  > static.json
  # java -Dbase.stars=true -jar $MIR_SA . | grep "^{" | jq .  > static.json
  # java -Dprop.stars=true -jar $MIR_SA . | grep "^{" | jq .  > static.json

  cat ../prologue-check.lya ../epilogue.lya | sed "s/GROUND_TRUTH/$GROUND_TRUTH/" > generated.test
  # Replace node with cat to see the generated script
  node generated.test 2>&1 > /dev/null | sed "s;^;$t  ;" | grep correct
  # run main and compare results with static
  # node -e 'require("assert").deepStrictEqual(require("./dynamic.json"), require("./correct.json"));'
  # node -e 'var eq = require("lodash.isequal"); var c = require("./correct.json"); var d = require("./dynamic.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }' | nl
}

if [ "$#" -eq 1 ]; then
  cd $1
  analysis $1
  cd ..
else
  for d in t*/; do
    cd $d;
    analysis $d
    cd ..
  done
fi


