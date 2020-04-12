# Lya
_Module-aware Fracture and Recombination for Dynamic Analysis_

## What's Lya?

Lya is a coarse-grained dynamic analysis framework. At runtime, it fractures the
application  at  the  boundaries  of libraries,  transforms  their  context  and
interfaces  to insert  interposition  wrappers, and  recombines  them back  into
the  original structure.  Interposition  wrappers have  full  visibility at  any
interaction  that  crosses  a  boundary---including  global  variables,  runtime
primitives, access to the process's  environment, etc. This enables powerful but
inexpensive analyses that  answer questions about the  security, performance, or
general behavior of the program.

Programmers  interested  in  Lya  fall   under  two  categories.  The  first  is
programmers who want to  use one of the available analyses  to gain insight into
their  application.  These  can  install  and configure  Lya  with  an  existing
analysis---for more information see [how to use lya](how-to-use-Lya) below.

The second  is programmers who want  to write their own  analyses, achievable by
providing a few methods and parameters; in our experience, powerful analyses can
be expressed in only  a few lines of code---for more info, see  [how to write an
analysis](how-to-write-an-analysis) below.

## How to Use Lya?

Currently, Lya runs with Node v8.9.4.;
Setup Lya by cloning the repository or by running `npm i @andromeda/lya --save-dev`.

Then, add lya _as  a first import at the top-level  file_ in your project---that
is,  almost always  Lya  has to  be  the first  package to  be  loaded. One  can
configure  several parameters,  including  use  any of  the  predefined list  of
analyses.

```JavaScript
let lya = require("@andromeda/lya");
let conf = {
  save_results: 
  analysis: lya.preset.RWX,
};
lya.configRequire(require, conf);
require("./main.js");
```

For more configuration options and details, see the [configuration docs]().

## How to Create a New  Analysis?

Lya expects the  developer of a new  analysis to provide a few  methods that Lya
will hook  across all modules. It  supports five methods, but  a useful analysis
can be written with any subset of them.

Every time any of these methods is called, it is provided 

Lya's  built-in analyses---which  include  an  [access control](),  [performance
pathologies](), and  [interface types]()---are good  examples of how to  write a
sophisticated analysis,  but here  is a  small one that  counts all  accesses to
global variables from a module called `serial`:

```JavaScript
let count = {};
forevery.global.in(["serial"]).do({
  pre: (name, path) => {
    let o = resolve(name, path);
    count[o] = count[o]?  count[o] + 1 : 1;
  }
});
```
**TODO Correct and explain**

For more information on how to write an analysis, see the [analysis docs]().
