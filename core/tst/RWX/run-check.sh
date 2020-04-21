#!/bin/bash

# Note that git rev-parse will not work _inside_ submodules
MIR_SA=${MIR_PATH:-"$(git rev-parse --show-toplevel)/core/tst/tools/mir-sa.jar"}
[ ! -f $MIR_SA ] && ../tools/fetch.sh
GROUND_TRUTH="${GROUND_TRUTH:-static}" # ground truth can be: static, dynamic, correct

tryGenCorrect() {
    if [[ -f $CORRECT ]]; then
      # echo $d
    else
      echo $d generating
      java -jar $MIR_SA . | grep "^{" | jq . | sed "s;$PWD;PWD_REPLACE;" > correct.pwd.json
    fi
    cat correct.pwd.json | sed "s;PWD_REPLACE;$(pwd);" > correct.json
}

analysis() {
  # Dynamic analysis comes from a different segment so that
  # static analysis does not get confused
  t="$(echo $1 | sed 's;/;;' | sed 's;$;:;')"
  if [[ $GROUND_TRUTH == "correct" ]]; then
    tryGenCorrect
  fi

  # generate static
  java -jar $MIR_SA . | grep "^{" | jq .  > static.json
  # java -Dmaybe.reaching=true -jar $MIR_SA . | grep "^{" | jq .  > static.json
  # java -Dbase.stars=true -jar $MIR_SA . | grep "^{" | jq .  > static.json
  # java -Dprop.stars=true -jar $MIR_SA . | grep "^{" | jq .  > static.json

  cat ../prologue-check.lya ../epilogue.lya | sed "s/GROUND_TRUTH/$GROUND_TRUTH/" > generated.test
  # Replace node with cat to see the generated script
  node generated.test 2>&1 > /dev/null | sed "s;^;$t  ;" | grep correct
  # to correct output to CSV: cat results.txt | sed 's/correct//' | tr "'" ' ' | tr ':' ' ' | tr -s ' ' ',' | sed 's/,$//'

  # run main and compare results with static
  # node -e 'require("assert").deepStrictEqual(require("./dynamic.json"), require("./correct.json"));'
  # node -e 'var eq = require("lodash.isequal"); var c = require("./correct.json"); var d = require("./dynamic.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }' | nl
}

if [ "$#" -eq 1 ]; then
  cd $1
  analysis $1
  cd ..
else
  for d in t?/ t??/ t???/; do
    cd $d;
    analysis $d
    cd ..
  done
fi


