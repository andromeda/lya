# ESEC/FSE'21 Artifact for Submission #286

# A Short Lya Tutorial
Quick jump: [Introduction](#introduction) | [Installation](#installation) | [Running Lya](#running-lya) | [Running Artifact](#running-artifact)

This short tutorial covers the `lya`'s main functionality.

## Introduction

Lya is a coarse-grained dynamic analysis framework that bolts onto a conventional production runtime as a library. Coarse-grained means that analyses with less detail than conventional frameworks but operates at a much lower overhead—enabling always-on operation on production environments. Despite operating at a coarser-than-typical granularity, it still allows for useful analyses. Examples include identifying security vulnerabilities, highlighting performance bottlenecks, and applying corrective actions.

#### Who should be interested?

Programmers interested in Lya fall under two categories. The first is programmers who want to use one of the available analyses to gain insight into their application. These can install and configure Lya with an existing analysis—for more information see how to use lya below.

The second is programmers who want to write their own analyses, achievable by providing a few methods and parameters; in our experience, powerful analyses can be expressed in only a few lines of code—for more info, see how to write an analysis below.

## Installation

Lya runs best with Node v8.9.4. You can use nvm (macOS/Linux) to switch Node versions between different projects.

#### From Npm

```sh
npm i @andromeda/lya --save-dev
```
If you want to install globally, so as to analyzing any program or library in the system, replace --save-dev with -g.

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

#### How to Create a New  Analysis?

Lya expects the  developer of a new  analysis to provide a few  methods that Lya
will hook  across all modules. It  supports several methods, but  a useful analysis
can be written with any subset of them. Example methods include `sourceTransform`, `onImport`, and `onRead`.

## Running Artifact

Start the lya container
```sh
docker pull gntousakis/lya-jalangi:1.0.2
lya=$(docker images | grep lya)
docker start -i $lya
```
