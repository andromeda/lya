# Lya: Efficient Module-Level Dynamic Analysis
> This is the repository for ESEC/FSE'21 submission #286 (Artifact submission #37)

Quick jump: [Introduction](#introduction) | [Artifact Info](#artifact-info) | [Installation](#installation) | [Running Lya](#running-lya) | [More on Lya](#more-on-lya)

## Introduction

Lya is a coarse-grained dynamic analysis framework that bolts onto a conventional production runtime as a library. Coarse-grained means that analyses with less detail than conventional frameworks but operates at a much lower overhead—enabling always-on operation on production environments. Despite operating at a coarser-than-typical granularity, it still allows for useful analyses. Examples include identifying security vulnerabilities, highlighting performance bottlenecks, and applying corrective actions.

#### Who should be interested?

Programmers interested in Lya fall under two categories. The first is programmers who want to use one of the available analyses to gain insight into their application. These can install and configure Lya with an existing analysis—for more information see how to use lya below.

The second is programmers who want to write their own analyses, achievable by providing a few methods and parameters; in our experience, powerful analyses can be expressed in only a few lines of code—for more info, see how to write an analysis below.

## Artifact Info

* [README.md](./README.md): This file, combined with the gist shared secretly with reviewers, explains what the artifact does and how it can be obtained. The gist contains secret credentials for running the experiments on the same machine used to obtain the results reported in the paper.

* [REQUIREMENTS.md](./REQUIREMENTS.md): This file covers aspects of software environment, including versions of Node.js and Racket.

* [STATUS.md](./STATUS.md): This file states what kind of badge(s) we are applying for, as well as the reasons why we believe that the artifact deserves that badge(s).

* [LICENSE](./LICENSE): This file describes the distribution rights. Lya is distributed under a permissive MIT License.

* [INSTALL](./INSTALL.md): This file covers instructions. These instructions also include notes illustrating a very basic usage example or a method to test the installation.

* [paper.pdf](./doc/lya-fse.pdf): This is the accepted version of the paper, sans `anonymous` and `review` options of the `acmart.cls` template.


## Installation

Lya runs best with Node v8.9.4. You can use nvm (macOS/Linux) to switch Node versions between different projects.

#### From npm

```sh
npm i @andromeda/lya --save-dev
```
If you want to install globally, so as to analyzing any program or library in the system, replace `--save-dev` with `-g`.

#### From source

```sh
git clone https://github.com/andromeda/lya/
cd lya
npm install
```

#### From docker image

```sh
docker pull gntousakis/lya-jalangi:1.0.2
lya=$(docker images | grep lya)
docker start -i $lya
```

## Running Lya

There are two ways to use Lya. The first is to use one of its existing dynamic analyses on an existing library.

#### Using an Existing Analysis

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

#### Creating a New  Analysis

Lya expects the  developer of a new  analysis to provide a few  methods that Lya will hook  across all modules. It  supports several methods, but  a useful analysis can be written with any subset of them. Example methods include `sourceTransform`, `onImport`, and `onRead`. See the [ICFP20 Tutorial]() on how to write an analysis with Lya.

## More on Lya

* [ICFP Tutorial Material](./doc/tutorial/)
* [Configuring and Using Lya](./doc/config.md)
* [Cool Tutorial to try](./doc/tutorial3)
* [Developing Analyses](./doc/dev.md)
* [Contributing](./doc/contrib.md)
* [Commits](lya-commits@googlegroups.com) 
* [Discussion](lya-discuss@googlegroups.com)
