#!/bin/bash

set -e

for d in t*/; do
  cd $d;
  java -jar ../../mir-sa.jar . | grep "^{" | jq .  > RWX.static.json
  cd ..
done
