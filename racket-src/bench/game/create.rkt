#lang racket

(require "../../safe-module.rkt")

(safe-require "regex-redux-safe.rkt" (patches make-counting-place))

(define (res)
  (let [(l '())]
    (for ([x (in-range 5)])
      (let-values [((_ cpu real gc) (time-apply (lambda () (with-input-from-file "regex-redux-input.txt" bench-main)) '()))]
        (set! l (cons (list cpu real gc) l))))
    l))

(define r (res))

(define (write-to-file path l)
  (call-with-output-file path
    (lambda (output-port)
       (write l output-port))))

(write-to-file "regex-redux-safe-res.txt" r)
