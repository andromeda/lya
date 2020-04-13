#!/bin/bash

set -o pipefail
set -e

RUN_FUN=runStatic
CORRECT="./correct.pwd.json" 
MIR_SA=${MIR_PATH:-~/wrk/andromeda/mir/static-analysis/mir-sa.jar}

generatePwdCorrect() {
    if [[ -f $CORRECT ]]; then
      echo $d
    else
      echo $d generating
      java -jar $MIR_SA . | grep "^{" | jq . | sed "s;$PWD;PWD_REPLACE;" > correct.pwd.json
    fi
}

generateCorrect() {
  cat correct.pwd.json | sed "s;PWD_REPLACE;$(pwd);" > correct.json
}

runStatic(){
  java -jar $MIR_SA . | grep "^{" | jq . > static.json
}

if [ "$#" -eq 1 ]; then
  cd $1
  $RUN_FUN
  cd ..
else
  for d in t[3456789]?/ t???/; do
    cd $d;
    $RUN_FUN
    cd ..
  done
fi

# for d in t*/; do
#   cd $d;
#   cat correct.pwd.json | sed "s;PWD_REPLACE;$(pwd);" > correct.json
#   cd ..
# done
