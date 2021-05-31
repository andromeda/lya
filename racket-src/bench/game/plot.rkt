#lang racket

(require file/glob plot math/statistics)

(define safes (glob "*-safe-res.txt"))

(define vals
  (map (lambda (f)
         (let-values [((p n _) (split-path f))]
            (list (string-replace (path->string n) "-safe-res.txt" "")
                  (call-with-input-file f read)
                  (call-with-input-file (string-replace (path->string n)
                                                        "-safe"
                                                        "")
                                        read))))
       safes))

(define v
  (map (lambda (l)
         (list (car l)
               (mean (map car (cadr l)))
               (mean (map car (caddr l)))))
       vals))

(parameterize ((plot-y-transform log-transform))
  (plot-file
    (list
      (discrete-histogram
        (map (lambda (x) (vector (car x) (/ (cadr x) 1000))) v)
        #:label "safe" #:x-min 0 #:skip 2.5
        #:y-min 1 #:y-max 500)
      (discrete-histogram
        (map (lambda (x) (vector (car x) (/ (caddr x) 1000))) v)
        #:label "unsafe" #:color 2 #:line-color 2
        #:x-min 1 #:skip 2.5 #:y-min 1 #:y-max 500))
    "result.png"
    #:x-label "Benchmarks" #:y-label "Seconds (lower is better)"))
