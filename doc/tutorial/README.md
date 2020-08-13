# Library-Oriented Dynamic Analysis with Lya

### Tutorial for the 25th ACM SIGPLAN International Conference on Functional Programming (ICFP'20)

    Lya is  a corse-grained  dynamic analysis framework  that interposes  at the
    boundaries  of  libraries within  an  application.  It  is useful  for  both
    industrial users and academic researchers working with programs (i) that use
    many  small libraries  often  written  in functional  style,  and (ii)  with
    significant  dynamic behaviors  --  e.g., runtime  code evaluation,  dynamic
    loading,  and runtime  reflection.  Lya enables  concise analyses  targeting
    JavaScript libraries  and multi-library  programs to extract  information or
    enforce invariants.  Examples include identifying  security vulnerabilities,
    highlighting performance bottlenecks, and applying corrective actions.

## Tutorial Information

    The tutorial consists of three parts. The first part provides an overview of
    Lya, including  a comparison  with more  conventional approaches  to dynamic
    analysis.  The  second part  is  a  hands-on  session of  applying  built-in
    analyses  to real  libraries, including  configuration parameters  targeting
    their  granularity. The  third  part is  a live  coding  session focused  on
    building  an  analysis --  we  use  Lya’s interfaces  to  build  one of  the
    aforementioned analyses from scratch.

Join us on [Zoom]() and [Slack]().

#### Session 1: 9:00AM -- 9:30AM EDT

1. Motivation: Trends in Language Ecosystems ([Slides](), [Talk](), [Writing]())
2. Introduction: Dynamic Analysis
3. Overview: Library-Oriented Analysis

#### Session 2: 9:30AM -- 10:00AM EDT

1. Security: Allow-Deny Analysis
2. Performance: Call-Number/Time Analysis
3. Other Analyses: Type-Learning Analysis

#### Session 3: 10:30AM -- 11:00AM EDT

1. Externals: Interface & Abstractions
2. Internals: Transformations & Rebinding
3. Diving Deeper: Writing an Analysis

## Presenters 

* [Nikos Vasilakis]() (Massachusetts Institute of Technology)
* [Grigoris Ntousakis]() (TU Crete)

## Tools and Community

  Installation: `npm i -g @andromeda/lya`.

  GitHub Project: 

  Mailing List: 

  Additional Material:

## Citation

```bibtex
@inproceedings{lyaTutorial,
  author = {Vasilakis, Nikos and Ntousakis, Grigoris},
  title = {Library-Oriented Dynamic Analysis with Lya},
  year = {2020}
}
```
