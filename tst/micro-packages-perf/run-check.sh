#!/bin/bash

# Note that git rev-parse will not work _inside_ submodules
LYA_BASE=${LYA_BASE:-"$(git rev-parse --show-toplevel)/core/src/txfm.js"}
PRE="_"

rm time.txt

analysis() {
  cd $1
  t="$(echo $1 | sed 's;/;;' | sed 's;$;:;')"
  a=$2
  m=$(cat package.json | jq .main | tr -d '"')
    
  # PROLOGUE

  # If entry file exists, rename it
  nm="$(dirname $m)/$PRE$(basename $m)"
  [ ! -f $nm ] && mv $m $nm

  read -r -d '' PLG <<PROLOGUE
let lya = require("$LYA_BASE");
let conf = {
  debugName: '$t',
  analysis: lya.preset.$a,
  context: {
    excludes: ['Promise', 'toString', 'escape', 'setImmediate'],
  },
  modules: {
    include: [require.resolve("$nm")]
  },
  printResults: true,
};
lya.configRequire(require, conf);
module.exports = require("$nm");
PROLOGUE

  echo "$PLG" | tee $m

  # npm test 2>&1 > /dev/null | sed "s;^;$t  ;" | grep correct
   echo "The name of file $t and analysis $a: " >> ../time.txt
  (time npm test) > /dev/null 2>> ../time.txt 

  cd ..

  # run main and compare results with static
  # node -e 'require("assert").deepStrictEqual(require("./dynamic.json"), require("./correct.json"));'
  # node -e 'var eq = require("lodash.isequal"); var c = require("./correct.json"); var d = require("./dynamic.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }' | nl
}

if [ "$#" -eq 1 ]; then
  analysis $1
else
  for analysis in RWX PROFILING_RELATIVE CALL_NUMBERS; do
    for d in */; do
      analysis $d $analysis
    done
  done
fi


