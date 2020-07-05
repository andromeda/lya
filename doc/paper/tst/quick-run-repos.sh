cd working/repos

cd ./classnames
[ -e timebind.txt ] && rm timebind.txt

npm --key=0 test > /dev/null
npm --key=1 test > /dev/null
npm --key=2 test > /dev/null 
echo "We run 1-2 test for classnames"

cd ../debug/debug-master/
[ -e timetest.txt ] && rm timetest.txt

npm --key=1  test > /dev/null
npm --key=2  test > /dev/null
echo "We finish 1-2 test for debug"

cd ../../minimist/t2_repo/
cd t1 
[ -e timetest.txt ] && rm timetest.txt

key=1 node whitespace.js > /dev/null
key=2 node whitespace.js > /dev/null
echo "Test 1-2 from minimist repo "