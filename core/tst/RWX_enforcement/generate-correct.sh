#!/bin/bash

set -o pipefail
set -e

for d in t*/; do
  cd $d;
  cat correct.pwd.json | sed "s;PWD_REPLACE;$(pwd);" > correct.json
  cd ..
done
