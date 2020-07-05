----------------------------------------------------------------------
                            ICFP 2020
 25th ACM SIGPLAN International Conference on Functional Programming

                       August 23 - 28, 2020 
                             Virtual
                    https://icfp20.sigplan.org/

                       TUTORIAL PROPOSAL FORM

----------------------------------------------------------------------

This form is due July 17th, 2020.


NAME OF THE TUTORIAL:
    Library-oriented Dynamic Analysis with Lya


PRESENTER(S):

   (Please complete the following table for each presenter.)

   Name    : Nikos Vasilakis
   Address : MIT
   Email   : nikos@vasilak.is
   Mobile  : +12672058229

   Name    : Greg Ntousakis
   Address : TU Crete
   Email   : gntousakis@isc.tuc.gr
   Mobile  : +306981744623


OVERVIEW / OUTLINE:
    (What the tutorial is about, and how it is structured; followup
     sections refer to this section.)

    Lya is a library-oriented dynamic-analysis framework for JavaScript, useful for both industrial users and academic researchers.
    It enables quick insights on libraries and multi-library programs with significant dynamic behaviors---e.g., runtime code evaluation, dynamic loading, runtime reflection.
    Example insights are the following.
      Which libraries contribute the most to a performance pathology?
      Which libraries read or write certain global variable?
      What are a library’s side-effects outside itself?
    
    The tutorial consists of three parts.
    The first part provides an overview of Lya, including a discussion of its trade-offs with respect to more conventional approaches to dynamic analysis.
    The second part is a hands-on session of applying built-in analyses to real libraries;
      among other examples, we extract an program's dependency graph, we identify bottlenecked libraries, and we infer how libraries accesses other libraries and the surrounding environment.
    The third part is a live coding session focused on building an analysis from scratch---we use Lya’s interfaces to build one of the aforementioned analyses.
    This part will also showcase some of the configuration parameters quickly affecting the granularity of the analysis in terms of libraries, fields, and root points.


REQUIRED PARTICIPANT BACKGROUND:

   (What background knowledge and skills will be assumed? Is the
   tutorial primarily intended for industrial users of functional
   programming, researchers in functional programming, or some other
   audience?)

   Participants are not required to have any special background apart from basic programming.
   The first part of the tutorial will introduce challenges in multi-module and any required background.
   The second part is primarily intended for industrial users that need quick insights 
   The third part is primarily intended for researchers, as it enables writing analyses for understanding, checking, or correcting a program's runtime behavior.

   (More broadly, the ideas presented in this tutorial are transplantable to other languages or environments.)

LEARNING OUTCOMES:

   (What will participants be able to do after the tutorial?)

   There are three main outcomes.
   After the first part, participants will learn about the problems of many third-party libraries in modern multi-library programs;
   this is important for both researchers and industrial users, albeit for somewhat different reasons.
   After the second part, participants will be able to use lya out of the box to get insights on real codebases by configuring one of the built-in analyses.
   After the third part, participants will be able to use Lya's API to build their own analyses---for understanding, checking, or correcting a program's runtime behavior. 

   All three outcomes are important for both researchers and industrial users.
   Industrial users learn about (and how to learn about) the problems of third-party libraries, and researchers are provided an abstraction layer to get insights and results on real codebases.

SCHEDULING CONSTRAINTS:
    (Are there any days on which you cannot hold the tutorial?
   What is your timezone? Any constraints on the timing of the event?)

   Our time-zones are EDT and EET, thus an ideal range would be 10AM to about 4PM.
   We would prefer to avoid the 24th, if possible.


PARTICIPANT PREPARATION:

    (What preparation is required? Do participants need to bring
    laptops?  If so, do they need to have any particular software?)

    Participants are recommended to bring and use their own computer, primarily for part 2.
    They do not need to set up any particular software---we will do so during the tutorial.


PLANS FOR PUBLICITY:

   (Including, but not limited to, web pages, mailing lists, and
   newsgroups.)

   The project lives on GitHub.
   We plan on publishing all the tutorial materials.

   We plan on announcing the tutorial on twitter and on a few relevant mailing lists:
     (i) Types, (ii) security, (iii) capabilities/membranes
   We also plan to advertise around several groups that we know are interested in this---MIT, TU Darmstadt, University of Stuttgart, and others.


ADDITIONAL INFORMATION:

   (If there is any additional information that you would like
   to make us aware of, please include the details here.

   For example, you may wish to indicate a preference for particular
   dates, or that the tutorial should not be run in parallel with
   certain workshops; in such cases, please also include the
   reasons for your preference.)
