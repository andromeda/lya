#lang racket/base

(provide make check make-checking-place place-channel-put place-channel-get)

#;(struct node (left right))
(define node cons)
(require racket/place
         (rename-in racket/unsafe/ops
                    [unsafe-car node-left]
                    [unsafe-cdr node-right]
                    [unsafe-fx+ +]
                    [unsafe-fx- -]
                    [unsafe-fx= =]))

(define (make d)
  (if (= d 0)
      (node #f #f)
      (let ([d2 (- d 1)])
        (node (make d2) (make d2)))))

(define (check t)
  (let sum ([t t] [acc 0])
    (cond [(node-left t) (sum (node-right t) (sum (node-left t) (+ 1 acc)))]
          [else          (+ 1 acc)])))

(define (make-checking-place)
  (place ch
    (let loop ()
    (define iterations (place-channel-get ch))
    (define d (place-channel-get ch))
    (define out (for/sum ([_ (in-range iterations)])
                  (check (make d))))
      (place-channel-put ch out)
      (loop))))

(module+ main
  (define (main n)
    (define min-depth 4)
    (define max-depth (max (+ min-depth 2) n))
    (define stretch-depth (+ max-depth 1))

    ;Select how to split the task
    ;when n=21, we get:
    ;steps = '(2 2 2 2 1)
    ;interval = '((4 6) (8 10) (12 14) (16 18) (20))
    ; the first is calculated in the main program, and the rest in places
    (define total (+ (quotient (- max-depth min-depth) 2) 1))
    (define cpu 4)
    (define steps (append (for/list ([_ (in-range cpu)])
                            (quotient total cpu))
                          (list (remainder total cpu))))
    (define intervals (let-values ([(rev-out total)
                                    (for/fold ([rev-out '()] [total min-depth]) ([v (in-list steps)])
                                      (define next (+ total (* v 2)))
                                      (values (cons (for/list ([ i (in-range total next 2)]) i)
                                                    rev-out)
                                              next))])
                        (reverse rev-out)))

    ; main part of the program
    (define long-lived-tree (make max-depth))
    (define chanells (for/list ([c (in-list (cdr intervals))])
                       (define ch (make-checking-place))
                       (for/list ([d (in-list c)])
                         (define iterations (arithmetic-shift 1 (+ (- max-depth d) min-depth)))
                         (place-channel-put ch iterations)
                         (place-channel-put ch d)
                         (list iterations d ch))))
    (define chanellsx (cons (let ([c (car intervals)])
                              (for/list ([d (in-list c)])
                                (define iterations (arithmetic-shift 1 (+ (- max-depth d) min-depth)))
                                (define r (for/sum ([_ (in-range iterations)])
                                            (check (make d))))
                                (list iterations d r)))
                            chanells))
    (for ([vs (in-list chanellsx)])
      (for ([v (in-list vs)])
        (begin
                (car v)
                (cadr v)
                (let ([r (caddr v)])
                  (if (number? r)
                      r
                      (place-channel-get r))))))
    (printf "long lived tree of depth ~a\t check: ~a\n" max-depth (check long-lived-tree)))

  (provide bench-main)
  (define (bench-main) (main 21))
)
