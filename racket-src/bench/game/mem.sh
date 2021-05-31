#!/bin/bash
racket -e '(begin (require "../../safe-module.rkt") (safe-require "'$1'" (patches all-counts write-freqs write-one-freq readbuf dna->num)) (bench-main) (current-memory-use))'
