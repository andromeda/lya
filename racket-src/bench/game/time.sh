#!/bin/bash
ts=$(gdate +%s%N)
racket -e '(begin (require "../../safe-module.rkt") (require "'$1'"))'
echo $((($(gdate +%s%N) - $ts)/1000000))
