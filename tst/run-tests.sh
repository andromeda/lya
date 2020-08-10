#!/bin/bash
  
##
# Runs all test cases
##

echo '>>>' $(pwd)
for d in export-types imports profiling rwx; do
  cd $d
  echo '>>>' $(pwd)
  ./run-dynamic.sh
  cd ..
done
