#lang racket/base

(require "spectral-norms.rkt")

(provide bench-main)
(define (bench-main) (spectral-norms 5500))
