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
