cd ./tst/working/repos

cd ./classnames
npm test

cd ../debug/debug-master/
npm test

cd ../../minimist/t2_repo/
cd t1
node whitespace.js 
echo "Test 1 from minimist repo is .... ok"
cd ../t2
node stop_early.js
echo "Test 2 from minimist repo is .... ok"
cd ../t3
node short.js
echo "Test 3 from minimist repo is .... ok"
cd ../t4
node long.js
echo "Test 4 from minimist repo is .... ok"
cd ../t5
node dotted.js
echo "Test 5 from minimist repo is .... ok"
echo "We can add more if we want"

cd ../../../mkdirp/t2_repo/
cd t1
node mkdirp.js 
echo "Test 1 from mkdirp repo is .... ok"
cd ../t2
node race.js
echo "Test 2 from mkdirp repo is .... ok"
cd ../t3 
node rel.js
echo "Test 3 from mkdirp repo is .... ok"
echo "We can add more if we want"

cd ../../../moment/t2/
node main.js
echo "Test from moment repo is .... ok"

cd ../../yargs/t_repo/yargs/
npm test
