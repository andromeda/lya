#!/bin/bash

git clone git@github.com:pluma/rtrn.git
cd rtrn
npm install
npm test
cd ..
./run-check.sh rtrn

# git clone git@github.com:substack/identity-function.git
# git clone git@github.com:LinusU/has-own-property.git     
# git clone git@github.com:sindresorhus/has-own-prop.git
# git clone git@github.com:dcousens/is-sorted.git
# git clone git@github.com:jonschlinkert/array-first.git
# git clone git@github.com:jonschlinkert/array-last.git
# git clone git@github.com:jonschlinkert/pad-left.git
# git clone git@github.com:left-pad/left-pad.git
# git clone git@github.com:ycmjason/pad-left-simple.git
# git clone git@github.com:jonschlinkert/arr-flatten.git
# git clone git@github.com/mk-pmb/flatten-js
# git clone git@github.com/jonschlinkert/in-array
# git clone git@github.com:michaelzoidl/swap-array.git
# git clone git@github.com:johnwquarles/mirrarray.git
# git clone git@github.com:sindresorhus/trim-right.git
# git clone git@github.com:Xotic750/trim-right-x.git
# # ./module/index
# git@github.com:stoeffel/compose-function.git
# git@github.com:hipstersmoothie/compose-tiny.git
# 
# git clone git@github.com:sindresorhus/onetime.git
# cd onetime
# # revert to an earlier version
# git checkout 32bca382f5934c8fe7fd78bcef9ad16b3474948f
# cd ..
