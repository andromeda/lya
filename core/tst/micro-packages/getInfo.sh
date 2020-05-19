#!/bin/bash

# Note that git rev-parse will not work _inside_ submodules
PRE="_"

getInfo() {
  cd $1
  t="$(echo $1 | sed 's;/;;' | sed 's;$;:;')"
  m=$(cat package.json | jq .main | tr -d '"')
  dep=$(cat package.json | jq .dependencies)
  github=$(cat package.json | jq .repository.url )
  name=$(echo "$t" | sed 's/.$//')

  # Store the package name
  echo "Package name: $name" >> ../info.txt
  # Store the github url
  echo "$github" >> ../info.txt
  # Store the number of lines
  wc -l $PRE$m >> ../info.txt
  # Store the name of the contributor
  npm view $name maintainers.name | { read maint; echo "Maintainer: $maint"; } >> ../info.txt
  # Store the number of packages
  echo "$dep" | wc -l | { read number; echo "Dependencies: $(expr $number - 2)"; }  >> ../info.txt
  
  cd ..
}

if [ "$#" -eq 1 ]; then
  getInfo $1 
else
  for d in */; do
    getInfo $d
  done
fi
