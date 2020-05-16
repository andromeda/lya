#!/bin/bash

PRE="_"

analysis() {
  cd $1
  t="$(echo $1 | sed 's;/;;' | sed 's;$;:;')"
  m=$(cat package.json | jq .main | tr -d '"')
  
  mir-sa $PRE$m > ../staticFiles/static$t.json
  mir-sa -b $PRE$m > ../staticFiles/staticbase$t.json
  mir-sa -f $PRE$m > ../staticFiles/staticfield$t.json
  mir-sa -bf $PRE$m > ../staticFiles/staticboth$t.json
  
  cd ..
}

rm -rf staticFiles
mkdir staticFiles
if [ "$#" -eq 1 ]; then
  analysis $1
else
  for d in */; do
    analysis $d
  done
fi


