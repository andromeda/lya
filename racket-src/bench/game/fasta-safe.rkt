#lang racket

(require "fasta.rkt")

(provide bench-main)
(define (main n)
  (make-cumulative-table IUB)
  (make-cumulative-table HOMOSAPIEN)

  (display ">ONE Homo sapiens alu\n")
  (repeat-fasta +alu+ (* n 2))
  (display ">TWO IUB ambiguity codes\n")
  (random-fasta IUB (* n 3))
  (display ">THREE Homo sapiens frequency\n")
  (random-fasta HOMOSAPIEN (* n 5)))

(define (bench-main) (main 25000000))
