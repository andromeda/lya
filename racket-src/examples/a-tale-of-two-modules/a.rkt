#lang racket

(provide unsafe)

(define (unsafe) (write "hi")) ; this is the naughty bit