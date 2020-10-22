#!/bin/bash

PRE="_"

clone(){
  dir=$1
  cd packages

  git clone $dir 
  cd "$(basename "$1" .git)"
  hash=$(git log --before="4 year ago" -n 1  --format="%H")
  git reset $hash
  git reset --soft HEAD@{1}
  git commit -m "Revert"
  git reset --hard
  echo "$hash"

  npm install 
  cd ../../
}

build(){

  #Make folder when it doesnt exist
  mkdir -p packages

  #Set-up counters
  number=`expr $1 + 1`
  counter=1
  

  while [ $counter -lt $number ]
  do
    package=$(head -n $counter mostDep.txt | tail -1 | cut -d "[" -f2 | cut -d "]" -f1)  
    directory=$(npm view $package repository.url ) 
    if [[ "$directory" == *"git+"* ]]; then
      directory=$(echo "$directory" | sed 's/^.\{4\}//') 
    fi
    
    # If the package is cloned skip it
    if [ ! -d "./packages/$package" ] 
    then
      clone $directory
    fi

    counter=`expr $counter + 1`
    
  done
}

dynamic(){
  cd $1
  t="$(echo $1 | sed 's;/;;' | sed 's;$;:;')"
  m=$(cat package.json | jq .main | tr -d '"')

  # If entry file exists, rename it
  nm="$(dirname $m)/$PRE$(basename $m)"
  [ ! -f $nm ] && mv $m $nm

  read -r -d '' PLG <<PROLOGUE
let lya = require("@andromeda/mir-da");
let conf = {
  debugName: '$t',
  analysis: lya.preset.RWX,
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"), 
  fields: {
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
  npm test > /dev/null
  cd ..
}

if [ "$#" -eq 1 ]; then
  build $1
else
  build 1000
fi

cd packages
for d in */; do
  dynamic $d
done
