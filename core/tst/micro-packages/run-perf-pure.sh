#!/bin/bash

PRE="_"
rm pure-time

analysis() {
  cd $1
  t="$(echo $1 | sed 's;/;;' | sed 's;$;:;')"
  m=$(cat package.json | jq .main | tr -d '"')
  
  # Move the pure file to folder and rename prologue file
  echo "$m"  
  mkdir tempFolder
  mv $m tempFolder/
  mv $PRE$m $m
  
  echo "Time $t" >> ../pure-time
  #loopNumber=100
  #for ((i=0; i<=loopNumber; i=i+1))
  #do
    (time npm test) 2>> ../pure-time
  #done
  
  mv $m $PRE$m
  mv tempFolder/$m $m
  rm -rf tempFolder
  cd ..

}

if [ "$#" -eq 1 ]; then
  analysis $1
else
  for d in */; do
    analysis $d
  done
fi

