#!/bin/bash

# Note that git rev-parse will not work _inside_ submodules
LYA_BASE=${LYA_BASE:-"$(git rev-parse --show-toplevel)/core/src/txfm.js"}
PRE="_"

analysis() {
  cd $1
  t="$(echo $1 | sed 's;/;;' | sed 's;$;:;')"
  m=$(cat package.json | jq .main | tr -d '"')
  type=$2

  # If entry file exists, rename it
  nm="$(dirname $m)/$PRE$(basename $m)"
  [ ! -f $nm ] && mv $m $nm

  read -r -d '' PLG <<PROLOGUE
let lya = require("$LYA_BASE");
let conf = {
  debugName: '$t',
  timerStart: process.hrtime(),
  analysis: lya.preset.$type,
  context: {
    excludes: ['Promise', 'toString', 'escape', 'setImmediate'],
  },
  modules: {
    include: [require.resolve("$nm")]
  },
  reportTime: true,
};
lya.configRequire(require, conf);
module.exports = require("$nm");
PROLOGUE

  echo "$PLG" | tee $m

  # npm test 2>&1 > /dev/null | sed "s;^;$t  ;" | grep correct
  echo "Time $t $type" >> ../time
  loopNumber=100
  for ((i=0; i<=loopNumber; i=i+1))
  do
    (npm test) &>> ../time
  done
  cd ..

  # run main and compare results with static
  # node -e 'require("assert").deepStrictEqual(require("./dynamic.json"), require("./correct.json"));'
  # node -e 'var eq = require("lodash.isequal"); var c = require("./correct.json"); var d = require("./dynamic.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }' | nl
}

for a in CALL_NUMBERS PROFILING_RELATIVE GLOBAL_ONLY RWX_PERFORMANCE; do
  if [ "$#" -eq 1 ]; then
    analysis $1 $a
  else
    for d in */; do
      analysis $d $a
    done
  fi
done 

grep Time time > timeOnly.txt

