#lang racket/base

(require "knucleotide.rkt")

(provide bench-main)
(define (bench-main)
  (define dna (readbuf (current-input-port) dna->num))

  (write-freqs (all-counts 1 dna) 1)
  (newline)

  (write-freqs (all-counts 2 dna) 2)
  (newline)

  ;; Specific sequences:
  (for ([seq '(#"GGT" #"GGTA" #"GGTATT" #"GGTATTTTAATT" #"GGTATTTTAATTTATAGT")]) 
    (write-one-freq (all-counts (bytes-length seq) dna) seq)))
