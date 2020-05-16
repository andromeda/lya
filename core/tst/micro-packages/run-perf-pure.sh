#!/bin/bash

# Note that git rev-parse will not work _inside_ submodules
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
const timerStart = process.hrtime();
process.on('exit', function() {
    const timerEnd = process.hrtime(timerStart);
    const nanos = (timerEnd[0] * 1e9) + timerEnd[1];
    const millis = nanos / 1e6;
    console.log(millis, 'Time');
  });
module.exports = require("$nm");
PROLOGUE

  echo "Package is $nm"
  echo "$PLG" | tee $m
  echo "Time $t $type" >> ../time
  
  loopNumber=100
  for ((i=0; i<=loopNumber; i=i+1))
  do
    (npm test) &>> ../time
  done
  cd ..
}

if [ "$#" -eq 1 ]; then
    analysis $1 $a
else
  for d in */; do
    analysis $d $a
  done
fi

