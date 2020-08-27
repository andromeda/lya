## Library-oriented Dynamic Program Analysis for JavaScript

Mailing lists: [Commits](lya-commits@googlegroups.com) | [Discussion](lya-discuss@googlegroups.com)

## What's Lya?

Lya is a coarse-grained dynamic analysis framework that bolts onto a conventional production runtime as a library.
Coarse-grained means that analyses with less detail than conventional frameworks but operates at a much lower overhead—enabling always-on operation on production environments.
Despite operating at a coarser-than-typical granularity, it still allows for useful analyses.
Examples include identifying security vulnerabilities, highlighting performance bottlenecks, and applying corrective actions.

## Who should be interested?

Programmers  interested  in  Lya  fall   under  two  categories.  The  first  is
programmers who want to  use one of the available analyses  to gain insight into
their  application.  These  can  install  and configure  Lya  with  an  existing
analysis—for more information see [how to use lya](#how-to-use-Lya) below.

The second  is programmers who want  to write their own  analyses, achievable by
providing a few methods and parameters; in our experience, powerful analyses can
be expressed in only  a few lines of code—for more info, see  [how to write an
analysis](#how-to-write-an-analysis) below.

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

## Quick Start

#### How to Use Lya?

Then, add lya _as  a first import at the top-level  file_ in your project—that
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
For more configuration options and details, see the [configuration docs](./doc/config.md).

#### How to Create a New  Analysis?

Lya expects the  developer of a new  analysis to provide a few  methods that Lya
will hook  across all modules. It  supports several methods, but  a useful analysis
can be written with any subset of them. Example methods include `sourceTransform`, `onImport`, and `onRead`.
Their details are provided in [doc](./doc/dev.md).

## Docs

* [ICFP Tutorial Material](./doc/tutorial/)
* [Configuring and Using Lya](./doc/config.md)
* [Developing Analyses](./doc/dev.md)
* [Contributing](./doc/contrib.md)

