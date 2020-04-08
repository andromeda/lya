#!/bin/bash

set -o pipefail
set -e

analysis() {
  # Dynamic analysis comes from a different segment so that
  # static analysis does not get confused
  cat ../prologue.lya ../epilogue.lya > generated.test
  # Replace node with cat to see the generated script
  node generated.test
}

if [ "$#" -eq 1 ]; then
  cd $1
  analysis
  sleep 3
  cd ..
else
  for d in t?/ t??/; do
    cd $d;
    echo
    echo "This is analysis $d"
    analysis
    sleep 2
    cd ..
  done
fi

