#!/bin/bash
set -e
# or call the script with its absolute name
cd $(dirname $0)

pwd

# if [[ $(uname) == "Linux" ]]; then
cd ./chalk/t1
node main.js
echo "chalk - Test 1 .... ok"
cd ..

cd ./t2
node main.js
echo "chalk - Test 2 .... ok"
cd ../../
# fi

cd ./commander/t1
node main.js
echo "commander - Test 1 .... ok"
cd ../../

cd ./lodash/t1
node main.js
echo "lodash - Test 1 .... ok"
cd ../t2

node main.js
echo "lodash - Test 2 .... ok"
cd ../../

cd ./moment/t1
node main.js
echo "moment - Test 1 .... ok"
cd ../../

cd ./t1
node main.js
echo "general - Test 1 .... ok"
cd ..

cd ./t2
node main.js
echo "general - Test 2 .... ok"
cd ..

cd ./t3
node main.js
echo "general - Test 3 .... ok"
cd ..

cd ./t4
node main.js
echo "general - Test 4 .... ok"
cd ..

cd ./t5
node main.js
echo "general - Test 5 .... ok"
cd ..
