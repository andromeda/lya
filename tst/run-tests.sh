#!/bin/bash
set -e
# or call the script with its absolute name
cd $(dirname $0)

cd ./t1
node test.js
echo "Test 1 .... ok"
cd ..

cd ./t2
node test.js
echo "Test 2 .... ok"
cd ..

cd ./t3
node test.js
echo "Test 3 .... ok"
cd ..

cd ./t4
node test.js
echo "Test 4 .... ok"
cd ..
