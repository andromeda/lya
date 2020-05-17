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
};
lya.configRequire(require, conf);
module.exports = require("$nm");
PROLOGUE

  echo "$PLG" | tee $m

  # npm test 2>&1 > /dev/null | sed "s;^;$t  ;" | grep correct
  echo "Time $t $type" >> ../usertime
  loopNumber=100
  for ((i=0; i<=loopNumber; i=i+1))
  do
    (time npm test) >>/dev/null 2>> ../usertime
  done
  cd ..

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


