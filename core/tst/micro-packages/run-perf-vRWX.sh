#!/bin/bash

# Note that git rev-parse will not work _inside_ submodules
LYA_BASE=${LYA_BASE:-"$(git rev-parse --show-toplevel)/core/src/txfm.js"}
PRE="_"

analysis() {
  cd $1
  t="$(echo $1 | sed 's;/;;' | sed 's;$;:;')"
  m=$(cat package.json | jq .main | tr -d '"')
  include=$2

  # If entry file exists, rename it
  nm="$(dirname $m)/$PRE$(basename $m)"
  [ ! -f $nm ] && mv $m $nm

  read -r -d '' PLG <<PROLOGUE
let lya = require("$LYA_BASE");
let conf = {
  debugName: '$t',
  timerStart: process.hrtime(),
  analysis: lya.preset.RWX_PERFORMANCE,
  context: {
    include: ['$include'],
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

  echo "Time $t $include" >> ../timeVar
  loopNumber=100
  for ((i=0; i<=loopNumber; i=i+1))
  do
    (npm test) &>> ../timeVar
  done
  cd ..

  # run main and compare results with static
  # node -e 'require("assert").deepStrictEqual(require("./dynamic.json"), require("./correct.json"));'
  # node -e 'var eq = require("lodash.isequal"); var c = require("./correct.json"); var d = require("./dynamic.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }' | nl
}
:
for a in user-globals es-globals node-globals module-locals module-returns; do
  if [ "$#" -eq 1 ]; then
    analysis $1 $a
  else
    for d in */; do
      analysis $d $a
    done
  fi
done 

grep Time timeVar > timeOnlyVar.txt

