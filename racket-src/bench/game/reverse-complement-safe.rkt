#lang racket/base

;;; The Computer Language Benchmarks Game
;;; https://salsa.debian.org/benchmarksgame-team/benchmarksgame/
;;; contributed by Eli Barzilay

(require "reverse-complement.rkt")

(provide bench-main)
(define (bench-main)
(define I (current-input-port))
(define O (current-output-port))
(let ([m (regexp-match #rx"^([^\n]+)\n" I)]) (display (car m)))

  (let loop ([buf (read-bytes buf-size I)] [start 0] [chunks '()])
    (if (eof-object? buf)
      (begin (output chunks O) (void))
      (case-regexp-posns #rx">" buf start
        [p1 (output (cons (vector start (car p1) buf) chunks) O)
            (case-regexp-posns #rx"\n" buf (cdr p1)
              [p2 (write-bytes buf O (car p1) (cdr p2))
                  (loop buf (cdr p2) '())]
              [else (write-bytes buf O (car p1))
                    (let header-loop ()
                      (let ([buf (read-bytes buf-size I)])
                        (case-regexp-posns #rx"\n" buf 0
                          [p2 (write-bytes buf O 0 (cdr p2))
                              (loop buf (cdr p2) '())]
                          [else (write-bytes buf O) (header-loop)])))])]
        [else (loop (read-bytes buf-size I) 0
                    (cons (vector start (bytes-length buf) buf) chunks))]))))
