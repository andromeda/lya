#lang racket/base

(require "pidigits.rkt")

(provide bench-main)
(define (bench-main) (digits 10000))
