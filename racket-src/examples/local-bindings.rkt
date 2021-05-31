#lang racket

(define (x write) ; write is not naughty anymore
  (let [(display (lambda (x) x))] ; display is not naughty anymore
    (write "hi")
    (display x)))