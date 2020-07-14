#!/bin/bash

set -o pipefail
set -e

analysis() {
  cat ../prologue-require.lya ../epilogue.lya > generated.test
  # Replace node with cat to see the generated script
  node generated.test | grep 'lya'
}

if [ "$#" -eq 1 ]; then
  cd $1
  analysis
  cd ..
else
  for d in t?/ t??/; do
    cd $d;
    analysis
    cd ..
  done
fi


