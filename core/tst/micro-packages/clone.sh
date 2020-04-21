#!/bin/bash

# https://github.com/parro-it/awesome-micro-npm-packages

update() {
  cd $1
  npm install
  npm test
  cd ..
}

git clone git@github.com:pluma/rtrn.git
git clone git@github.com:substack/identity-function.git
git clone git@github.com:LinusU/has-own-property.git     
git clone git@github.com:sindresorhus/has-own-prop.git
git clone git@github.com:dcousens/is-sorted.git
git clone git@github.com:jonschlinkert/array-first.git
git clone git@github.com:jonschlinkert/array-last.git
git clone git@github.com:jonschlinkert/pad-left.git
git clone git@github.com:left-pad/left-pad.git
git clone git@github.com:ycmjason/pad-left-simple.git
git clone git@github.com:jonschlinkert/arr-flatten.git
git clone git@github.com:mk-pmb/flatten-js
git clone git@github.com:jonschlinkert/in-array
git clone git@github.com:michaelzoidl/swap-array.git
git clone git@github.com:johnwquarles/mirrarray.git
git clone git@github.com:sindresorhus/trim-right.git
git clone git@github.com:Xotic750/trim-right-x.git
# ./module/index
git@github.com:stoeffel/compose-function.git
git@github.com:hipstersmoothie/compose-tiny.git


git clone git@github.com:sindresorhus/onetime.git
cd onetime
# revert to an earlier version
git checkout 32bca382f5934c8fe7fd78bcef9ad16b3474948f
cd ..

# Array
git clone git@github.com:dcousens/is-sorted
git clone git@github.com:jonschlinkert/array-first
git clone git@github.com:jonschlinkert/array-last
git clone git@github.com:jonschlinkert/arr-flatten
git clone git@github.com:seriousManual/dedupe
git clone git@github.com:mattdesl/array-range
git clone git@github.com:jonschlinkert/arr-diff
git clone git@github.com:sindresorhus/filled-array
git clone git@github.com:parro-it/map-array
git clone git@github.com:jonschlinkert/in-array
git clone git@github.com:mafintosh/unordered-array-remove
git clone git@github.com:michaelzoidl/swap-array
git clone git@github.com:johnwquarles/mirrarray
git clone git@github.com:doowb/group-array
git clone git@github.com:zhiyelee/array.chunk

# String
git clone git@github.com:sindresorhus/decamelize
git clone git@github.com:jonschlinkert/pad-left
git clone git@github.com:ianstormtaylor/to-camel-case
git clone git@github.com:ianstormtaylor/to-capital-case
git clone git@github.com:ianstormtaylor/to-constant-case
git clone git@github.com:ianstormtaylor/to-dot-case
git clone git@github.com:ianstormtaylor/to-no-case
git clone git@github.com:ianstormtaylor/to-pascal-case
git clone git@github.com:ianstormtaylor/to-sentence-case
git clone git@github.com:ianstormtaylor/to-snake-case
git clone git@github.com:ianstormtaylor/to-space-case
git clone git@github.com:ianstormtaylor/to-title-case
git clone git@github.com:dodo/node-slug
git clone git@github.com:sergejmueller/rtrim
git clone git@github.com:hustcc/slice.js
git clone git@github.com:chalk/strip-ansi
git clone git@github.com:ericnorris/striptags
git clone git@github.com:ErikOnBike/parse-next-json-value

# Date and Time
git clone git@github.com:sindresorhus/pretty-ms
git clone git@github.com:seriousManual/hirestime
git clone git@github.com:timruffles/periods
git clone git@github.com:taylorhakes/fecha
git clone git@github.com:jucrouzet/akamai-time-reference
git clone git@github.com:hustcc/timeago.js
git clone git@github.com:shinnn/count-days-in-month
git clone git@github.com:jonschlinkert/time-stamp
git clone git@github.com:vutran/twas

# Object
git clone git@github.com:sindresorhus/map-obj
git clone git@github.com:sindresorhus/filter-obj
git clone git@github.com:sindresorhus/object-values
git clone git@github.com:eush77/object-pairs
git clone git@github.com:landau/zipmap
git clone git@github.com:jarofghosts/just-pluck
git clone git@github.com:substack/node-deep-equal
git clone git@github.com:sindresorhus/deep-assign
git clone git@github.com:jonschlinkert/set-value
git clone git@github.com:jonschlinkert/get-value
git clone git@github.com:jonschlinkert/has-value
git clone git@github.com:ryanaghdam/has-key-deep
git clone git@github.com:ricardobeat/flatkeys
git clone git@github.com:watson/flatten-obj
git clone git@github.com:gummesson/is-empty-object
git clone git@github.com:yeoman/stringify-object
git clone git@github.com:domenic/sorted-object
git clone git@github.com:fibo/static-props
git clone git@github.com:vladgolubev/missing-deep-keys
git clone git@github.com:LinusU/has-own-property
git clone git@github.com:shevaroller/node-merge-objects
git clone git@github.com:mattphillips/deep-object-diff

# Function
git clone git@github.com:stoeffel/compose-function
git clone git@github.com:dominictarr/curry
git clone git@github.com:isaacs/once
git clone git@github.com:jonschlinkert/deep-bind
git clone git@github.com:substack/identity-function
git clone git@github.com:sindresorhus/mem
git clone git@github.com:niksy/throttle-debounce
git clone git@github.com:hipstersmoothie/compose-tiny

# Math
git clone git@github.com:jonschlinkert/is-number

# Stream
git clone git@github.com:rvagg/through2
git clone git@github.com:brycebaril/through2-filter
git clone git@github.com:brycebaril/through2-map
git clone git@github.com:brycebaril/node-stream-spigot
git clone git@github.com:maxogden/concat-stream
git clone git@github.com:dominictarr/JSONStream
git clone git@github.com:RangerMauve/through2-map-promise
git clone git@github.com:mafintosh/pump
git clone git@github.com:dominictarr/split
git clone git@github.com:sindresorhus/is-stream
git clone git@github.com:mcollina/syncthrough

#  # Promise
#  git clone git@github.com:sindresorhus/pify
#  git clone git@github.com:Siilwyn/promise-all-props
#  git clone git@github.com:brummelte/sleep-promise
#  git clone git@github.com:then/is-promise
#  
#  # FS
#  git clone git@github.com:isaacs/rimraf
#  git clone git@github.com:substack/node-mkdirp
#  git clone git@github.com:rvagg/node-du
#  git clone git@github.com:Nijikokun/file-size
#  git clone git@github.com:raszi/node-tmp
#  git clone git@github.com:kevinbeaty/fs-promise
#  
#  # Browser
#  git clone git@github.com:zenorocha/delegate
#  git clone git@github.com:substack/insert-css
#  git clone git@github.com:crysalead-js/dom-element-value
#  git clone git@github.com:bfred-it/image-promise
#  git clone git@github.com:bfred-it/get-media-size
#  git clone git@github.com:bendrucker/document-ready
#  git clone git@github.com:styfle/copee
#  
#  # Sevmver
#  git clone git@github.com:npm/node-semver
#  git clone git@github.com:eush77/semver-max
#  git clone git@github.com:parro-it/semver-first-satisfied
#  
#  # CLI
#  git clone git@github.com:isaacs/abbrev-js
#  git clone git@github.com:isaacs/node-glob
#  git clone git@github.com:sindresorhus/username
#  git clone git@github.com:substack/minimist
#  git clone git@github.com:steambap/png-to-ico
#  git clone git@github.com:eush77/help-version
#  
#  # Module management 
#  git clone git@github.com:sindresorhus/pkg-conf
#  git clone git@github.com:jonschlinkert/normalize-pkg
#  
#  # Generators
#  git clone git@github.com:blakeembrey/is-generator

# Other
git clone git@github.com:kelektiv/node-uuid
git clone git@github.com:broofa/node-mime
git clone git@github.com:fibo/not-defined
git clone git@github.com:parro-it/is-fqdn

### Text

git clone git@github.com:ashtuchkin/iconv-lite
git clone git@github.com:sindresorhus/string-length
git clone git@github.com:sindresorhus/camelcase
git clone git@github.com:sindresorhus/escape-string-regexp
git clone git@github.com:sindresorhus/execall
git clone git@github.com:sindresorhus/splice-string
git clone git@github.com:sindresorhus/indent-string
git clone git@github.com:sindresorhus/strip-indent
git clone git@github.com:sindresorhus/detect-indent
git clone git@github.com:mathiasbynens/he
git clone git@github.com:mashpie/i18n-node
git clone git@github.com:nodeca/babelfish
git clone git@github.com:sindresorhus/matcher
git clone git@github.com:nodeca/unhomoglyph
git clone git@github.com:i18next/i18next
git clone git@github.com:ai/nanoid

### Number

git clone git@github.com:sindresorhus/random-int
git clone git@github.com:sindresorhus/random-float
git clone git@github.com:sindresorhus/unique-random
git clone git@github.com:sindresorhus/round-to

### Math

git clone git@github.com:scijs/ndarray
git clone git@github.com:josdejong/mathjs
git clone git@github.com:sindresorhus/math-clamp
git clone git@github.com:fibo/algebra
git clone git@github.com:nodeca/multimath

### Date

git clone git@github.com:moment/luxon
git clone git@github.com:date-fns/date-fns
](http://momentjs.com
git clone git@github.com:iamkun/dayjs
git clone git@github.com:felixge/node-dateformat
git clone git@github.com:samverschueren/tz-format
git clone git@github.com:floatdrop/node-cctz

### URL

git clone git@github.com:sindresorhus/normalize-url
git clone git@github.com:sindresorhus/humanize-url
git clone git@github.com:nodeca/url-unshort
git clone git@github.com:pid/speakingurl
git clone git@github.com:markdown-it/linkify-it
git clone git@github.com:snd/url-pattern
git clone git@github.com:nodeca/embedza

### Data validation

git clone git@github.com:hapijs/joi
git clone git@github.com:mafintosh/is-my-json-valid
git clone git@github.com:nettofarah/property-validator
git clone git@github.com:Atinux/schema-inspector
git clone git@github.com:epoberezkin/ajv



if [ "$#" -eq 1 ]; then
  update $1
else
  for d in */; do
    update $d
  done
fi


