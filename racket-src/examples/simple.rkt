#lang racket

; this is a very simple example of a naughty module. It does IO, and it really
; ought to know better!

(provide naughty)

(define (naughty s) (display s))
