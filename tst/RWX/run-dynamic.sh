#!/bin/bash

set -e

for d in t*/; do
  cd $d;
  ./run.sh
  cd ..
done
