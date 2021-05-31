#lang racket/base

;;; The Computer Language Benchmarks Game
;;; https://salsa.debian.org/benchmarksgame-team/benchmarksgame/

;;; based on a version by by Anthony Borla
;;; regex-dna program contributed by Matthew Flatt
;;; converted from regex-dna program
;;; Parallelized by Gustavo Massaccesi, 2018


(require racket/port
         racket/place
         racket/list
         "regex-redux.rkt")

(provide bench-main)
(define (bench-main)
   ;; Load sequence
  (define orig (port->bytes))
  (define filtered (regexp-replace* #rx#"(?:>.*?\n)|\n" orig #""))

  ;; Create the places and launch the regexp counts
  ;; Since it is not possible to split the replacement part,
  ;; it's faster to use two places instead of three. 
  (define VARIANTS1 (drop-right VARIANTS 4))
  (define VARIANTS2 (take-right VARIANTS 4))

  (define place/ch1 (make-counting-place))
  (place-channel-put place/ch1 filtered)
  (place-channel-put place/ch1 VARIANTS1)

  (define place/ch2 (make-counting-place))
  (place-channel-put place/ch2 filtered)
  (place-channel-put place/ch2 VARIANTS2)
    
  ;; Perform regexp replacements while the places are running
  (define replaced
          (for/fold ([sequence filtered]) ([IUB IUBS])
            (regexp-replace* (byte-regexp (car IUB)) sequence (cadr IUB))))

  ;; Collect the results of the regexp counts
  (define count1 (place-channel-get place/ch1))
  (define count2 (place-channel-get place/ch2))


  ;; Print regexp counts
  (for ([i (in-list VARIANTS)]
        [j (in-list (append count1 count2))])
    (printf "~a ~a\n" i j))

  ;; Print statistics
  (printf "\n~a\n~a\n~a\n"
          (bytes-length orig) (bytes-length filtered) (bytes-length replaced))
)

