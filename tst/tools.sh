#!/bin/bash

grep -o -E ':[[:blank:]]*[[:digit:]]+,?' ./dynamic.json |
  grep -o -E '[[:digit:]]+' |
  tr '\n' '+' |
  sed 's/$/0/' |
  bc | sed 's/^/sum of calls for all functions: /'

grep -o -E ':[[:blank:]]*[[:digit:]]+,?' ./dynamic.json |
  grep -o -E '[[:digit:]]+' |
  wc -l |
  sed 's/^/number of functions accessed: /'
