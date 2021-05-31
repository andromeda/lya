#lang racket

(provide collatz collatz-range)

(define (collatz n)
  (if (even? n)
      (/ n 2)
      (+ (* 3 n) 1)))

(define (collatz-range m)
  (for-each (lambda (n) (collatz n))
            (stream->list (in-range 0 m))))
