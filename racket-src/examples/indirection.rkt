#lang racket

(provide presumed-safe)

(define presumed-safe eval) ; indirection, but still naughty
