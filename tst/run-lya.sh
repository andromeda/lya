# Run lya.js with differnent inputs

../lya.js ../tst/rwx/t1/main.js 
../lya.js ../tst/rwx/t1/main.js -p 

echo "We run with module-exclude, m2.js"
../lya.js ../tst/rwx/t1/main.js -p --module-exclude "tst/rwx/t1/m2.js"
echo "We run with module-exclude, m1.js, m2.js"
../lya.js ../tst/rwx/t1/main.js -p --module-exclude "tst/rwx/t1/m2.js,tst/rwx/t1/m1.js"
echo "We run with module-include, m1.js"
../lya.js ../tst/rwx/t1/main.js -p --module-include "tst/rwx/t1/m1.js"
echo "We run with module-include, m1.js, m2.js"
../lya.js ../tst/rwx/t1/main.js -p --module-include "tst/rwx/t1/m1.js,tst/rwx/t1/m2.js"

echo "We run with context-exclude, module-locals"
../lya.js ../tst/rwx/t1/main.js -p --context-exclude "module-locals"
echo "We run with context-exclude, module-locals,node-globals"
../lya.js ../tst/rwx/t1/main.js -p --context-exclude "module-locals,node-globals"
echo "We run with context-include, module-locals"
../lya.js ../tst/rwx/t1/main.js -p --context-include "module-locals"
echo "We run with context-include, module-locals,node-globals"
../lya.js ../tst/rwx/t1/main.js -p --context-include "module-locals,node-globals"

echo "We are going to test prop with t3"
../lya.js ../tst/rwx/t4/main.js -p

echo "We run with prop-exclude, console"
../lya.js ../tst/rwx/t4/main.js -p --prop-exclude "console"
echo "We run with prop-exclude, console, Error"
../lya.js ../tst/rwx/t4/main.js -p --prop-exclude "console,Error"
echo "We run with prop-include, console"
../lya.js ../tst/rwx/t4/main.js -p --prop-include "console"
echo "We run with prop-include, console,Error"
../lya.js ../tst/rwx/t4/main.js -p --prop-include "console,Error"

