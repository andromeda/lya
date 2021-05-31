#lang racket

(require "../../safe-module.rkt")

(safe-require "spectral-norms-safe.rkt" (patches spectral-norms))

(define (res)
  (let [(l '())]
    (for ([x (in-range 5)])
      (let-values [((_ cpu real gc) (time-apply bench-main '()))]
        (set! l (cons (list cpu real gc) l))))
    l))

(define r (res))

(define (write-to-file path l)
  (call-with-output-file path
    (lambda (output-port)
       (write l output-port))))

(write-to-file "spectral-norms-safe-res.txt" r)
