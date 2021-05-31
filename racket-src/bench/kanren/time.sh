#!/bin/bash
ts=$(gdate +%s%N)
racket -e '(begin (require "../../safe-module.rkt") (safe-require "'$1'" (disallow eval)))'
echo $((($(gdate +%s%N) - $ts)/1000000))
