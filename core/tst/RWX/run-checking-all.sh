#!/bin/bash

LOOP_ALL=loopAll
RUN_CHECKING=runChecking

runChecking() {
  json=$1
  cat ../prologue-check.lya | sed "s;REPLACE_ME;$json;" > prologue.lya
  cat prologue.lya ../epilogue.lya > generated.test
  rm prologue.lya
  (node generated.test) > ../test.txt
}

loopAll() {
  for name in correct dynamic static; do
    $RUN_CHECKING $name
  done
}

if [ "$#" -eq 1 ]; then
  cd $1
  $LOOP_ALL
  cd ..
else
  for d in t[3456789]?/ t???/; do
    cd $d;
    $LOOP_ALL
    cd ..
  done
fi

