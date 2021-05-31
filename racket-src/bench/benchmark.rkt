#!/usr/bin/env racket
#lang racket

(require benchmark plot/pict racket racket/runtime-path compiler/find-exe)

(when (< (vector-length (current-command-line-arguments)) 1)
  (error "Please provide a directory to benchmark."))

(define dir (vector-ref (current-command-line-arguments) 0))
(define compiled-dir (string-append dir "/compiled"))
(define safe (string-append dir "/safe.rkt"))
(define unsafe (string-append dir "/unsafe.rkt"))

(define results
    (run-benchmarks
     (list 'dflt)
     (list (list safe unsafe))
     ; how to run each benchmark
     (lambda (_ file) (system* (find-exe) file))
     #:build
     (lambda (_ file)
       (system* (find-exe) "-l" "raco" "make" file))
     #:clean
     (lambda (_ file)
       (system* (find-executable-path "rm") "-r" "-f" compiled-dir))
     #:extract-time 'delta-time
     #:num-trials 30
     #:make-name (lambda (path) (symbol->string path))))

(parameterize ([plot-x-ticks no-ticks])
    (plot-file
     #:title "safe vs. unsafe on benchmark"
     #:x-label #f
     #:y-label "normalized time"
     (render-benchmark-alts
      (list safe)
      results)
    "results.png"))
