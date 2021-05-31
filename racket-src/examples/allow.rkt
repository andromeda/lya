#lang racket

(safe-require "./examples/indirection.rkt" (allow eval))

(provide x)

(define x presumed-safe)
