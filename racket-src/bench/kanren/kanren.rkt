#lang racket

(require minikanren)

(provide appendo bench-main)

(define appendo
  (lambda (l s ls)
    (conde
      [(== '() l) (== s ls)]
      [(fresh (a d res)
         (== `(,a . ,d) l)
         (== `(,a . ,res) ls)
         (appendo d s res))])))

(define (bench-main)
  (run 1000 (p)
    (fresh (q)
      (appendo q '(d e) p))))
