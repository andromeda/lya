#!/bin/bash

# set -e

[ -e timeResults.txt ] && rm timeResults.txt

echo "We are going to run colorette"
cd colorette-master

echo "Colorette" >> timeResults.txt

cd test
name=index.js
sed -i "1s/^/for (var loopiiii = 0; loopiiii < 100; loopiiii++) {\n/" $name 
sed -i "\$a}" $name
cd ../
(time npm test) >> /dev/null 2>> "timeResults.txt"

cd test
sed '$d' < $name | sed "1d"



