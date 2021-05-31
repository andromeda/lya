#lang racket/base

;; The Computer Language Benchmarks Game
;; https://salsa.debian.org/benchmarksgame-team/benchmarksgame/
;;
;; Imperative-style implementation based on the SBCL implementation by
;; Patrick Frankenberger and Juho Snellman, but using only native Scheme
;; idioms like 'named let' and 'do' special form.
;;
;; Contributed by Anthony Borla, then converted for Racket
;; by Matthew Flatt and Brent Fulgham
;; Made unsafe and optimized by Sam TH
#|
Correct output N = 1000 is

-0.169075164
-0.169087605
|#

(require "nbody.rkt")

;; -------------------------------

(provide bench-main)
(define (main n)
  (offset-momentum)
  (printf "~a\n" (real->decimal-string (energy) 9))
  (for ([i (in-range n)]) (advance))
  (printf "~a\n" (real->decimal-string (energy) 9)))
(define (bench-main) (main 50000000))
