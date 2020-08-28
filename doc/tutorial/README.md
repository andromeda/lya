# Library-Oriented Dynamic Analysis with Lya

### Tutorial for the 25th ACM SIGPLAN International Conference on Functional Programming (ICFP'20)

Lya  is  a corse-grained  dynamic  analysis  framework  for interposes  at  the
boundaries of libraries within an application.  It is useful for both industrial
users  and  academic  researchers  working  with  programs  (i)  that  use  many
small libraries  often written  in functional style,  and (ii)  with significant
dynamic  behaviors  --  e.g.,  runtime code  evaluation,  dynamic  loading,  and
runtime reflection. Lya enables  concise analyses targeting JavaScript libraries
and  multi-library  programs  to  extract  information  or  enforce  invariants.
Examples include identifying  security vulnerabilities, highlighting performance
bottlenecks, and applying corrective actions.

## Tutorial Information

The tutorial  consists of three  parts. The first  part provides an  overview of
Lya,  including  a  comparison  with more  conventional  approaches  to  dynamic
analysis. The second part is a hands-on session of applying built-in analyses to
real libraries, including configuration  parameters targeting their granularity.
The third part  is a live coding  session focused on building an  analysis -- we
use Lya’s interfaces to build one of the aforementioned analyses from scratch.

Join us on [Zoom](https://us04web.zoom.us/j/73421488949?pwd=L2xDOXJiK3NobWxrbUtEdVYwSUJkZz09), [Slack](https://join.slack.com/share/zt-gu2dobw6-1yz8ztwWlSY0ldp61YyQXg), and [Clawdr](https://icfp2020.clowdr.org/program/PAcTDXxBty/JDGe1qETVP).

#### Session 1/3: Overview (9:00AM -- 9:45AM EDT)

([Slides](https://docs.google.com/presentation/d/19OcX1FAQ1j2YM81mUCxS42NkSFQfZaBXUCnaBqUY0NA/edit?usp=sharing))

1. Administrivia
2. Introduction / Motivation
3. Overview / Demo

#### Session 2: Configuration & Use (10:00AM -- 10:45AM EDT)

1. Security: Allow-Deny Analysis
2. Performance: Call-Number/Time Analysis
3. Other Analyses: Source-index

#### Session 3: Internals and Development (11:00AM -- 11:45AM EDT)

1. Externals: Hook Interface
2. Internals: Transformations & Rebinding
3. Diving Deeper: Writing an Analysis

## Presenters 

* [Nikos Vasilakis](https://github.com/nvasilakis) (Massachusetts Institute of Technology)
* [Grigoris Ntousakis](http://github.com/gntousakis) (TU Crete)

## Tools 

  Ideally, use [Node 8.9.4](https://nodejs.org/dist/v8.9.4/)

  Installation: `npm i -g @andromeda/lya`.

## Community

  GitHub Project: [github.com/andromeda/lya](https://github.com/andromeda/lya)

  Mailing lists: [Commits](lya-commits@googlegroups.com) | [Discussion](lya-discuss@googlegroups.com)

## Citation

```bibtex
@inproceedings{lyaTutorial,
  author = {Vasilakis, Nikos and Ntousakis, Grigoris},
  title = {Library-Oriented Dynamic Analysis with Lya},
  year = {2020}
}
```
