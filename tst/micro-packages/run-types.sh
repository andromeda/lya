#!/bin/bash
LYA_BASE=${LYA_BASE:-"$(git rev-parse --show-toplevel)/src/txfm.js"}
PRE="_"

analysis() {
  cd $1
  t="$(echo $1 | sed 's;/;;' | sed 's;$;:;')"
  m=$(cat package.json | jq .main | tr -d '"')
  
  # If entry file exists, rename it
  nm="$(dirname $m)/$PRE$(basename $m)"
  [ ! -f $nm ] && mv $m $nm

  read -r -d '' PLG <<PROLOGUE
let lya = require("$LYA_BASE");
let conf = {
  analysis: lya.preset.EXPORT_TYPE,
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  fields: {
    excludes: ['Promise', 'toString', 'escape', 'setImmediate'],
  },
  modules: {
    include: [require.resolve("$nm")],
    excludes: null,
  },
  print: true,
};
lya.configRequire(require, conf);
module.exports = require("$nm");
PROLOGUE

  echo "$PLG" | tee $m

  # npm test 2>&1 > /dev/null | sed "s;^;$t  ;" | grep correct
  npm test > /dev/null 

  cd ..

  # run main and compare results with static
  # node -e 'require("assert").deepStrictEqual(require("./dynamic.json"), require("./correct.json"));'
  # node -e 'var eq = require("lodash.isequal"); var c = require("./correct.json"); var d = require("./dynamic.json"); if (!eq(c, d)) { console.log(require("json-diff").diffString(c, d)); process.exit(-1); }' | nl
}

if [ "$#" -eq 1 ]; then
  analysis $1
else
  for d in */; do
    analysis $d
  done
fi


