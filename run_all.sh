cd ./tst/working/repos

cd ./classnames
[ -e timebind.txt ] && rm timebind.txt

npm --key=0 test > /dev/null
npm --key=1 test > /dev/null
npm --key=5 test > /dev/null
npm --key=2 test > /dev/null  
npm --key=3 test > /dev/null 
npm --key=4 test > /dev/null
npm --key=6 test > /dev/null
npm --key=7 test > /dev/null
echo "We all test for classnames"

cd ../debug/debug-master/
[ -e timetest.txt ] && rm timetest.txt

npm --key=0  test > /dev/null
npm --key=1  test > /dev/null
npm --key=5  test > /dev/null
npm --key=2  test > /dev/null
npm --key=3  test > /dev/null
npm --key=4  test > /dev/null
npm --key=6  test > /dev/null
npm --key=7  test > /dev/null
echo "We finish all test for debug"

cd ../../minimist/t2_repo/
cd t1 
[ -e timetest.txt ] && rm timetest.txt

key=0 node whitespace.js > /dev/null
key=1 node whitespace.js > /dev/null
key=5 node whitespace.js > /dev/null
key=2 node whitespace.js > /dev/null
key=3 node whitespace.js > /dev/null
key=4 node whitespace.js > /dev/null
key=6 node whitespace.js > /dev/null
key=7 node whitespace.js > /dev/null
echo "Test 1 from minimist repo is .... ok"

cd ../t2
[ -e timetest.txt ] && rm timetest.txt

key=0 node stop_early.js > /dev/null
key=1 node stop_early.js > /dev/null
key=5 node stop_early.js > /dev/null
key=2 node stop_early.js > /dev/null
key=3 node stop_early.js > /dev/null
key=4 node stop_early.js > /dev/null
key=6 node stop_early.js > /dev/null
key=7 node stop_early.js > /dev/null
echo "Test 2 from minimist repo is .... ok"

cd ../t3
[ -e timetest.txt ] && rm timetest.txt

key=0 node short.js  > /dev/null
key=1 node short.js  > /dev/null
key=5 node short.js  > /dev/null
key=2 node short.js  > /dev/null
key=3 node short.js  > /dev/null
key=4 node short.js  > /dev/null
key=6 node short.js  > /dev/null
key=7 node short.js  > /dev/null
echo "Test 3 from minimist repo is .... ok"

cd ../t4
[ -e timetest.txt ] && rm timetest.txt

key=0 node long.js > /dev/null
key=1 node long.js > /dev/null
key=5 node long.js > /dev/null
key=2 node long.js > /dev/null
key=3 node long.js > /dev/null
key=4 node long.js > /dev/null
key=6 node long.js > /dev/null
key=7 node long.js > /dev/null
echo "Test 4 from minimist repo is .... ok"

cd ../t5
[ -e timetest.txt ] && rm timetest.txt

key=0 node dotted.js > /dev/null
key=1 node dotted.js > /dev/null
key=5 node dotted.js > /dev/null
key=2 node dotted.js > /dev/null
key=3 node dotted.js > /dev/null
key=4 node dotted.js > /dev/null
key=6 node dotted.js > /dev/null
key=7 node dotted.js > /dev/null
echo "Test 5 from minimist repo is .... ok"

cd ../../../moment
[ -e timetest.txt ] && rm timetest.txt

key=0 node main.js > /dev/null
key=1 node main.js > /dev/null
key=5 node main.js > /dev/null
key=2 node main.js > /dev/null
key=3 node main.js > /dev/null
key=4 node main.js > /dev/null
key=6 node main.js > /dev/null
key=7 node main.js > /dev/null
echo "The test from moment is done..."

cd ../yargs/
[ -e timetest.txt ] && rm timetest.txt

npm --key=0  test > /dev/null
npm --key=1  test > /dev/null
npm --key=5  test > /dev/null
npm --key=2  test > /dev/null
npm --key=3  test > /dev/null
npm --key=4  test > /dev/null
npm --key=6  test > /dev/null
npm --key=7  test > /dev/null
echo "We finish all test for yargs"

