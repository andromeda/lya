
This page will include a more extended configuration guide, but for now taken directly from `lya --help`:

```
Analyze JavaScript programs dynamically, to extract information or enforce invariants.

lya <fl> [hpVvvv] [a=<a.js>] [d=<n>] [{module, context, prop}-{include, exclude}=<m | c | p>]

  <fl>                        File to start analysis from (i.e., program entry point).

  -h,   --help:               Output (this) help
  -V    --version:            Output version information
  -v, vv, vvv, --verbosity:   Add (multiple) verbosity levels

  -d,   --depth <n>:          Object depth to analyze (default 3)
  -a,   --analysis <a.js>:    The program analysis to execute (see below)
  -f,   --file <b.json>:      File/path to save results; defaults to 'lya.json'
  -p,   --print [<out, err>]: Stream to output results (defaults to file)
  -o,   --only-prologue:      Print only the config prologue

  --module-exclude <m>:       Comma-separated list of module IDs (absolute fs paths) to be excluded from the analysis
  --module-include <m>:       Comma-separated list of module IDs (absolute fs paths) to be included (assumes module-exclude='*')
  --context-exclude <c>:      Comma-separated context starting points to exclude from tracking (for contexts, see below)
  --context-include <c>:      Comma-separated context starting points to include in tracking  (assumes context-exclude='*')
  --prop-exclude <p>:         Comma-separated property names to exclude from analysis (e.g., 'Promise,toString,escape,setImmediate')
  --prop-include <p>:         Comma-separated property names to include in the  analysis (assumes prop-exclude='*')

  Contexts <c> are coarse groups of  program elements that are tracked, and fall
  under these categories (can be included in their long or short form):

  * module-locals, m:         Module-local names such as 'require'
  * node-globals, n:          All Node.js-related globals, such as 'console' and 'process'
  * es-globals, e:            All EcmaScript 6 globals names such Math.sin or
  * user-globals, g:          User-defined globals accessed with a 'global' prefix, e.g., 'global.y = 3'
  * with-globals, w:          User-defined globals accessed without a prefix, e.g., 'y = 3' (expensive to track)

  Analyses can be one of the build-in options below, or any absolute file-system path pointing to a user-defined analysis.
  Each analysis reads/writes invariants from/to a file, whose path defaults to "./lya.json" but can be overwritten via  '-f <f>'.

  Simple
  * imports:                  Extract dynamic dependency graph
  * global-only:              Extract accesses to global-only variables
  * sample                    No-op analysis used as a starting point
  * term-index:               Calculate TF-IDF metrics on source code
  * uncomment:                Uncomment code

  Access
  * on-off:                   Extracts an allow-deny access policy
  * on-off-enforce:           Enforces an allow-deny access policy

  Performance
  * call-time:                Extract call times for all functions called
  * call-freq:                Extract call frequencies for all functions and fields part of the analysis target

  Partial Specification
  * io                        Extract a base type signature every module field
  * io-effects                Extract a module type signature that includes effects
```
