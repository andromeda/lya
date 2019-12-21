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

key=0 node  whitespace.js > /dev/null
key=1 node  whitespace.js > /dev/null
key=5 node  whitespace.js > /dev/null
key=2 node  whitespace.js > /dev/null
key=3 node  whitespace.js > /dev/null
key=4 node  whitespace.js > /dev/null
key=6 node  whitespace.js > /dev/null
key=7 node  whitespace.js > /dev/null

echo "Test 1 from minimist repo is .... ok"

