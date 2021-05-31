#lang racket

(require "fannkuch-redux.rkt")

(define (main n)
  (define-values (answer checksum)
    (fannkuch n))
  (printf "~a\nPfannkuchen(~a) = ~a\n" 
          checksum
          n 
          answer))

(provide bench-main)
(define (bench-main) (main 12))
