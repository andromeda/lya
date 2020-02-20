cd working/synthetic
cd t1
[ -e timetest.txt ] && rm timetest.txt

key=0 node main.js > /dev/null
key=1 node main.js > /dev/null
key=5 node main.js > /dev/null
key=2 node main.js > /dev/null
key=3 node main.js > /dev/null
key=4 node main.js > /dev/null
key=6 node main.js > /dev/null
key=7 node main.js > /dev/null
echo "The 1st synthetic test.... ok"

cd ../t2
[ -e timetest.txt ] && rm timetest.txt

key=0 node main.js > /dev/null
key=1 node main.js > /dev/null
key=5 node main.js > /dev/null
key=2 node main.js > /dev/null
key=3 node main.js > /dev/null
key=4 node main.js > /dev/null
key=6 node main.js > /dev/null
key=7 node main.js > /dev/null
echo "The 2nd synthetic test.... ok"

cd ../t3
[ -e timetest.txt ] && rm timetest.txt

key=0 node main.js > /dev/null
key=1 node main.js > /dev/null
key=5 node main.js > /dev/null
key=2 node main.js > /dev/null
key=3 node main.js > /dev/null
key=4 node main.js > /dev/null
key=6 node main.js > /dev/null
key=7 node main.js > /dev/null
echo "The 3rd synthetic test.... ok"

cd ../t4
[ -e timetest.txt ] && rm timetest.txt

key=0 node main.js > /dev/null
key=1 node main.js > /dev/null
key=5 node main.js > /dev/null
key=2 node main.js > /dev/null
key=3 node main.js > /dev/null
key=4 node main.js > /dev/null
key=6 node main.js > /dev/null
key=7 node main.js > /dev/null
echo "The 4th synthetic test.... ok"

cd ../t5
[ -e timetest.txt ] && rm timetest.txt

key=0 node main.js > /dev/null
key=1 node main.js > /dev/null
key=5 node main.js > /dev/null
key=2 node main.js > /dev/null
key=3 node main.js > /dev/null
key=4 node main.js > /dev/null
key=6 node main.js > /dev/null
key=7 node main.js > /dev/null
echo "The 5th synthetic test.... ok"
