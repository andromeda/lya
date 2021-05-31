#lang racket

; example usage of safe-require for unsafe-read:
; (safe-require "examples/unsafe-read.rkt"
;   (patches ; the patches
;     (open-input-file
;        ; the patches get the original bindings as the first argument,
;        ; then a path to the file just in case, then the real arguments
;        (lambda (original path n)
;          (let-values [((dir _ _2) (split-path path))]
;            ; we take the dir we’re in and open an input file there instead
;            (original (string-append (path->string dir) n)))))))

(provide global-read)

(define (global-read)
  (let ([f (open-input-file "/test.txt")])
    (writeln (read-string 12 f))
    (close-input-port f)))
