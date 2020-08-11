## Library-oriented Dynamic Program Analysis for JavaScript

Mailing lists: [Commits](lya-commits@googlegroups.com) | [Discussion](lya-discuss@googlegroups.com)

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

## Installation

Lya runs with __Node v8.9.4__ (**FIXME: Add multiple versions to test on CI server**). You can use [nvm (macOS/Linux)](https://github.com/nvm-sh/nvm#installation) 
to switch Node versions between different projects.

### Option 1: Npm
```Shell
npm i @andromeda/lya --save-dev
```

If you want to install globally, so as to analyzing any program or library in the system, replace `--save-dev` with `-g`.

### Option 2: From source
```Shell 
git clone https://github.com/andromeda/lya/
cd lya
npm install
```

### Option 3: From docker image
```Shell
docker pull xxxxx
docker start -i "name of xxxxx"
```

**FIXME**

## How to Use Lya?

Then, add lya _as  a first import at the top-level  file_ in your project---that
is,  almost always  Lya  has to  be  the first  package to  be  loaded. One  can
configure  several parameters,  including  use  any of  the  predefined list  of
analyses. For example:

```JavaScript
let lya = require("@andromeda/lya");
let conf = {
  analysis: lya.preset.ON_OFF,
  saveResults: require("path").join(__dirname, "dynamic.json"),
};
lya.configRequire(require, conf);
require("./main.js");
```

The configuration above first configures running the `ON_OFF` analysis, and saves the results in `./dynamic.json`. 
For more configuration options and details, see the [configuration docs]().

## How to Create a New  Analysis?

Lya expects the  developer of a new  analysis to provide a few  methods that Lya
will hook  across all modules. It  supports several methods, but  a useful analysis
can be written with any subset of them. Example methods include `sourceTransform`, `onImport`, `onRead`.. Their details are provided in [doc](./doc).
