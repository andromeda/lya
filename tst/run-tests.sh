#!/bin/bash
set -e
# or call the script with its absolute name
cd $(dirname $0)

cd ./t1
node test.js
cd ..

cd ./t2
node test.js
cd ..
