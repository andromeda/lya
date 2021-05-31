#lang racket

(require syntax/location)
(require (for-syntax racket/base racket/function racket/list syntax/location
                     racket/format racket/path syntax/modresolve))

(provide safe-require)

; a sketch of a safe version of the require form

(define-syntax (safe-require stx) 
  (define CHECKED null)
  (define DIR #f)

  ; this is a modded version of resolve-module as found in the package whereis
  (define (resolve-module modpath)
    (define resolved
      (cond [(module-path-index? modpath)
               (resolve-module-path-index modpath DIR)]
            [(module-path? modpath)
               (if DIR (resolve-module-path modpath DIR) (resolve-module-path modpath))]))
    (resolved->string resolved))

  (define (resolved->string p)
    (let loop ([p p])
      (cond [(and (pair? p) (eq? (car p) 'submod)) (loop (cadr p))]
            [(path? p)
              (cond [(file-exists? p) (path->string p)]
                    [else (error "module path does not exist: " (path->string p))])]
            [(symbol? p) (error "built-in module has no path: " p)]
            [else (error "unexpected value: " p)])))

  (define LETS '(let let* letrec letrec* let-values))
  (struct context (parent name path vars disallowed))

  (define (empty-context)
    (context (void) (void) (void) '() '()))

  (define (empty-context? ctx)
    (void? (context-name ctx)))

  (define (module-context name path disallowed)
    (context (empty-context) name path '() disallowed)) 
  
  (define (add-fn ctx form)
    (context ctx (caadr form) (void) (cadr form)'()))

  (define (add-lambda ctx form)
    (context ctx 'lambda (void) (cadr form) '()))

  (define (add-var ctx form)
    (context ctx (string-append "[binding:" (~a (cadr form)) "]") (void) (list (cadr form)) '()))

  (define (add-let ctx form)
    (define (conforms? form) (and (list? form) (= (length form) 2)))
    (let [(vars (if (list? (cadr form)) (cadr form) (caddr form)))]
      (context ctx 'let (void) (flatten (map car (filter conforms? vars))) '())))
  
  (define (context-print-path ctx)
    (cond
      ((empty-context? ctx) "")
      ((empty-context? (context-parent ctx)) (~a (context-name ctx)))
      (else (string-append (context-print-path (context-parent ctx)) ":" (~a (context-name ctx))))))

  (define (context-add ctx var)
    (context (context-parent ctx) (context-name ctx) (context-path ctx) (cons var (context-vars ctx)) (context-disallowed ctx)))
  
  (define (in-context? ctx v)
    (if (empty-context? ctx)
      #f
      (or (member v (context-vars ctx)) (in-context? (context-parent ctx) v))))
  
  (define (context-all-disallowed ctx)
    (if (empty-context? ctx)
      '()
      (append (context-all-disallowed (context-parent ctx)) (context-disallowed ctx))))

  (define (context-get-module ctx)
    (cond
      ((or (empty-context? ctx) (void? (context-path ctx))) #f)
      ((empty-context? (context-parent ctx)) (context-path ctx))
      (else (context-get-module (context-parent ctx)))))

  (define (relativy ctx req)
    (let* [(m (context-get-module ctx))
           (relative-to (lambda (r)
             (let-values [((m _ _2) (split-path (resolve-module m)))]
               `(file ,(string-append (path->string m) r)))))]
      (if (not m)
          req
          (map (lambda (r)
                 (cond
                   ((string? r) (relative-to r))
                   ((and (list? r) (> (length r) 0) (eq? (car r) 'filtered-in))
                      (cons 'filtered-in (cons (cadr r) (relativy ctx (cddr r))))) 
                   ((list? r) (relativy ctx r))
                   (else r)))
               req))))
  
  (define (sanitize-fn ctx form)
    `(,(car form) ,(cadr form) ,@(map (curry sanitize-form ctx) (cddr form))))

  (define (sanitize-var ctx form)
    (list (car form) (cadr form) (sanitize-form ctx (caddr form))))

  (define (sanitize-let-head ctx form)
    (map (lambda (binding)
           (if (and (list? binding) (> (length binding) 1))
             (list (car binding) (sanitize-form ctx (cadr binding)))
             binding))
         form))

  (define (sanitize-let*-head ctx form)
    (cadr (foldl (lambda (binding ctx-and-values)
             (let ((ctx (car ctx-and-values))
                   (values (cadr ctx-and-values)))
               (if (list? binding)
                 (list (context-add ctx (car binding))
                   (append values (list (list (car binding) (sanitize-form ctx (cadr binding))))))
                 (list ctx (append values (list binding))))))
           (list ctx '())
           form)))

  (define (sanitize-any-let-head ctx type form)
    (case type
      ((let letrec let-values letrec-values) (sanitize-let-head ctx form))
      ((let* letrec*) (sanitize-let*-head ctx form))))

  (define (sanitize-form ctx form)
    (if (and (list? form) (> (length form) 0))
      (cond
        ((and (> (length form) 2) (eq? (car form) 'define))
          (if (list? (cadr form))
              (sanitize-fn (add-fn ctx form) form)
              (sanitize-var (add-var ctx form) form)))
        ((and (> (length form) 2) (eq? (car form) 'lambda))
           (sanitize-fn (add-lambda ctx form) form))
        ((and (> (length form) 2) (member (car form) LETS))
           (if (list? (cadr form))
             (cons (car form)
               (cons
                 (sanitize-any-let-head ctx (car form) (cadr form))
                 (map (curry sanitize-form (add-let ctx form)) (cddr form))))
             (let [(nctx (context-add ctx (cadr form)))]
               `(,(car form) ,(cadr form)
                 ,(sanitize-let-head nctx (caddr form))
                 ,@(map (curry sanitize-form (add-let nctx form)) (cdddr form))))))
        ((eq? (car form) 'require)
           (begin (make-require ctx (cdr form)) (relativy ctx form)))
        ((eq? (car form) 'provide)
           (relativy ctx form))
        ((eq? (car form) 'safe-require)
           (make-safe-require (cdr form)))
        ((and (member (car form) (context-all-disallowed ctx)) (not (in-context? ctx (car form)))) 
           (error (string-append "Found a blacklisted form in " (context-print-path ctx) ": ") form))
        (else (cons (car form) (map (curry sanitize-form ctx) (cdr form)))))
       (if (and (symbol? form) (member form (context-all-disallowed ctx)) (not (in-context? ctx form)))
           (error (string-append "Found a blacklisted form in " (context-print-path ctx) ": ") form)
           form)))

  (define (sanitize ctx forms)
    (map (curry sanitize-form ctx) forms))

  (define (sanitize-all disallow path name forms)
    (sanitize (module-context name path  disallow) forms))

  (define (patches forms path)
    (map (lambda (pair)
           (let* [(name (if (symbol? pair) pair (car pair)))
                  (gen (gensym name))
                  (body (if (symbol? pair) '(lambda (original _ . args) (apply original args)) (cadr pair)))]
             (list `(define ,name ,gen)
                   `(define ,gen (curry ,body ,name ,path)))))
         forms))

  (define (get-requires forms)
    (filter (lambda (form) (and (list? form) (not (empty? form)) (eq? (car form) 'require))) forms))

  (define (without-requires forms)
    (filter (lambda (form) (not (and (list? form) (not (empty? form)) (eq? (car form) 'require)))) forms))
  
  (define (build-module disallowed path patched name parent forms)
    (let [(generated (patches patched path))
          (sanitized (sanitize-all disallowed path name forms))]
      `(module ,name ,parent
          (require racket/function)
          ,@(get-requires sanitized)
          ,@(map cadr generated)
          (module* wrapped #f
            ,@(map car generated)
            ,@(without-requires sanitized)))))
   
  (define (safe-require- name #:disallow [disallow '()] #:patches [patched '()])
    (let ([accept-reader (read-accept-reader)])
      (if (and (empty? disallow) (empty? patched))
        #`(require #,name)
        (begin
          (read-accept-reader #t)
          (let* ([path (simplify-path (resolve-module name))]
                 [forms (call-with-input-file path read)]
                 [rel DIR])
            (read-accept-reader accept-reader)
            (set! DIR path)
            (if (and (> (length forms) 1) (eq? (car forms) 'module) (not (member path CHECKED)))
              (begin
                (set! CHECKED (cons path CHECKED))
                (let ([form (build-module disallow path patched (cadr forms) (caddr forms) (cdr (cadddr forms)))])
                  (set! DIR rel)
                  #`(begin
                      (define-namespace-anchor a)
                      (define ns (namespace-anchor->namespace a))
                      (eval '#,form ns)
                      (eval '(require (submod (quote #,(datum->syntax stx (cadr forms))) wrapped)) ns)
                      (current-namespace ns))))
              (begin
                (set! DIR rel)
                (datum->syntax stx forms))))))))

  (define (make-require ctx forms)
    (map (lambda (form)
           (when (not (list? form))
             (safe-require- form #:disallow (context-all-disallowed ctx))))
         forms))

  ; checks the forms and then returns the usual require
  (define (make-safe-require forms)
    (let [(len (length forms))]
      (cond
        ((and (= len 1) (safe-require- (car forms))))
        ((and (= len 2) (list? (cadr forms)) (> (length (cadr forms)) 0)
              (eq? (caadr forms) 'allow))
           (safe-require- (car forms) #:allow (cdadr forms)))
        ((and (= len 2) (list? (cadr forms)) (> (length (cadr forms)) 0)
              (eq? (caadr forms) 'disallow))
           (safe-require- (car forms) #:disallow (cdadr forms)))
        (else (error (string-append
                        "Did not understand safe-require with arguments "
                        (~a forms) "."))))
      `(require ,(car forms))))
  
  (syntax-case stx (allow disallow patches)
    [(_ name)
      (safe-require- (syntax->datum #'name))]
    [(_ name (disallow . names))       
      (safe-require- (syntax->datum #'name) #:disallow (syntax->datum #'names))]
    [(_ name (patches . patched))       
      (safe-require- (syntax->datum #'name) #:patches (syntax->datum #'patched))]
    [(_ (special ...) . names)
       #'(require (special ...))
       #`(safe-require #,@(syntax->datum #'names))]
    [(_ name . names)
       (safe-require- (syntax->datum #'name))
       #`(safe-require #,@(syntax->datum #'names))]))
