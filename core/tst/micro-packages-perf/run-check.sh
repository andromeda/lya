#!/bin/bash

# Note that git rev-parse will not work _inside_ submodules
MIR_SA=${MIR_PATH:-"$(git rev-parse --show-toplevel)/core/tst/tools/mir-sa.jar"}
[ ! -f $MIR_SA ] && ../tools/fetch.sh
LYA_BASE=${LYA_BASE:-"$(git rev-parse --show-toplevel)/core/src/txfm.js"}
GROUND_TRUTH="static" # There is no correct here, and dynamic is of little use?
PRE="_"

analysis() {
  cd $1
  t="$(echo $1 | sed 's;/;;' | sed 's;$;:;')"
  m=$(cat package.json | jq .main | tr -d '"')
  
  java -jar $MIR_SA $PRE$m | grep "^{" | jq . > static.json
  # java -Dmaybe.reaching=true -jar $MIR_SA . | grep "^{" | jq .  > static.json
  # java -Dbase.stars=true -jar $MIR_SA . | grep "^{" | jq .  > static.json
  # java -Dprop.stars=true -jar $MIR_SA . | grep "^{" | jq .  > static.json

  # TODO: Pattern for exclusive-wrapper command
  # It identifies an input file and calls the Lya only for that input file
  # read -r -d '' PLG <<PROLOGUE
  # let lya = require($LYA_BASE);
  # let conf = {
  #   analysis: lya.preset.RWX_CHECKING,
  #   rules: require("path").join(__dirname, "$GROUND_TRUTH.json"),
  #   modules: {
  #     includes: [require.resolve($m)]
  #   },
  #   printResults: true,
  # };
  # lya.configRequire(require, conf);
  # module.exports = require($m);
  # PROLOGUE

  # If entry file exists, rename it
  nm="$(dirname $m)/$PRE$(basename $m)"
  [ ! -f $nm ] && mv $m $nm

  read -r -d '' PLG <<PROLOGUE
let lya = require("$LYA_BASE");
let conf = {
  debugName: '$t',
  analysis: lya.preset.RWX_CHECKING,
  rules: require("path").join(__dirname, "$GROUND_TRUTH.json"),
  appendStats: "$(pwd)/stats.txt",
  debug: true,
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
   echo "The name of file $t: " >> ../time.txt
  (time npm test) > /dev/null 2>> ../time.txt 

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


