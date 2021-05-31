#lang racket

(require syntax/parse/define)

(define UNSAFE-NAMES '(
  write
  display
))

(define REWRITES `(
   (require safe-require)
))

(define (make-safe-namespace)
  (let ([ns (current-namespace)])
    (for ([name UNSAFE-NAMES])
      (namespace-undefine-variable! name ns))
    (for ([elem REWRITES])
        (namespace-set-variable-value! (car elem) (cadr elem) ns))
    ns))

(define (reference->resolved-module-path mod)
  (cond
   [(resolved-module-path? mod) mod]
   [else
    (define mpi (if (module-path-index? mod)
                    mod
                    (module-path-index-join mod #f)))
    (module-path-index-resolve mpi #f)]))

(define-simple-macro (safe-require module)
  `(parameterize ([current-namespace (make-safe-namespace)])
    (require ,module)))
