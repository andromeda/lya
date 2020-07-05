#!/bin/bash
PRE="_"

analysis() {
  cd $1
  t="$(echo $1 | sed 's;/;;' | sed 's;$;:;')"
  m=$(cat package.json | jq .main | tr -d '"')
  
  a=$(mir-sa     $(dirname $m)/$PRE$(basename $m) | wc -l)
  b=$(mir-sa -b  $(dirname $m)/$PRE$(basename $m) | wc -l)
  c=$(mir-sa -f  $(dirname $m)/$PRE$(basename $m) | wc -l)
  d=$(mir-sa -bf $(dirname $m)/$PRE$(basename $m) | wc -l)
  echo "$t $a $b $c $d" | tr ' ' ',' | sed 's/,$//' | sed 's/^,//' | sed 's;./;;'
  cd ..
}

if [ "$#" -eq 1 ]; then
  analysis $1
else
  for d in */; do
    analysis $d
  done
fi

