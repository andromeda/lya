#!/bin/bash

# https://github.com/parro-it/awesome-micro-npm-packages

update() {
  cd $1
  npm install
  npm test
  cd ..
}

# Promise
git clone git@github.com:sindresorhus/pify
git clone git@github.com:Siilwyn/promise-all-props
git clone git@github.com:brummelte/sleep-promise
git clone git@github.com:then/is-promise
  
# FS
git clone git@github.com:isaacs/rimraf
git clone git@github.com:substack/node-mkdirp
git clone git@github.com:rvagg/node-du
git clone git@github.com:Nijikokun/file-size
git clone git@github.com:raszi/node-tmp
git clone git@github.com:kevinbeaty/fs-promise
  
# Browser
git clone git@github.com:zenorocha/delegate
git clone git@github.com:substack/insert-css
git clone git@github.com:crysalead-js/dom-element-value
git clone git@github.com:bfred-it/image-promise
git clone git@github.com:bfred-it/get-media-size
git clone git@github.com:bendrucker/document-ready
git clone git@github.com:styfle/copee
  
# Sevmver
git clone git@github.com:npm/node-semver
git clone git@github.com:eush77/semver-max
git clone git@github.com:parro-it/semver-first-satisfied
  
# CLI
git clone git@github.com:isaacs/abbrev-js
git clone git@github.com:isaacs/node-glob
git clone git@github.com:sindresorhus/username
git clone git@github.com:substack/minimist
git clone git@github.com:steambap/png-to-ico
git clone git@github.com:eush77/help-version
  
# Module management 
git clone git@github.com:sindresorhus/pkg-conf
git clone git@github.com:jonschlinkert/normalize-pkg
  
# Generators
git clone git@github.com:blakeembrey/is-generator

if [ "$#" -eq 1 ]; then
  update $1
else
  for d in */; do
    update $d
  done
fi


