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
    (What is the tutorial about? How it is structured? Next sections refer 
    to this section.)

    Lya  is a  library-oriented  dynamic-analysis framework.  It  is useful  for
    both industrial  users and  academic researchers  working with  programs (i)
    use  hundreds of  tiny  libraries  often written  in  functional style,  and
    (ii) employ  significant dynamic behaviors---e.g., runtime  code evaluation,
    dynamic loading,  runtime reflection. Lya allows  concise analyses targeting
    JavaScript  libraries  and  multi-library  JavaScript  programs  to  extract
    information or enforce invariants.
    
    The tutorial consists of three parts. The first part provides an overview of
    Lya, including  a comparison  with more  conventional approaches  to dynamic
    analysis.  The  second part  is  a  hands-on  session of  applying  built-in
    analyses to real libraries,  demonstrating configuration options for quickly
    tuning the granularity  of any analysis; among other examples,  we extract a
    program's dependency graph, we identify bottlenecked libraries, and we infer
    how libraries accesses other libraries  and the surrounding environment. The
    third part is a live coding session focused on building an analysis---we use
    Lya’s interfaces to build one of the aforementioned analyses from scratch.


REQUIRED PARTICIPANT BACKGROUND:

   (What background knowledge and skills will be assumed? Is the
   tutorial primarily intended for industrial users of functional
   programming, researchers in functional programming, or some other
   audience?)

   The tutorial  assumes no background  apart from basic programming.  Its first
   part takes care of introducing  the necessary background for both researchers
   and practitioners. The second part is primarily intended for industrial users
   or researchers  that need  quick insights from  built-in analyses.  The third
   part is primarily intended for researchers, as it allows writing analyses for
   understanding, checking, or correcting a program's runtime behavior.


LEARNING OUTCOMES:

   (What will participants be able to do after the tutorial?)

   After the  first part,  participants will  gain a  good understanding  of the
   problems with  third-party libraries in modern  multi-library programs. After
   the second part, participants will be able to apply Lya out of the box to get
   insights on real codebases by configuring one of the built-in analyses. After
   the third  part, participants  will be  able to leverage  Lya's API  to build
   their own  analyses---for understanding, checking, or  correcting a program's
   runtime behavior.

   All three outcomes  are important for both researchers  and industrial users.
   Industrial  users learn  about  (and  how to  learn  about)  the problems  of
   third-party libraries, and  researchers are provided an  abstraction layer to
   get insights and results on real codebases.

SCHEDULING CONSTRAINTS:
    (Are there any days on which you cannot hold the tutorial?
   What is your timezone? Any constraints on the timing of the event?)

   Our time-zones are  EDT and EET, thus  an ideal range would be  10AM to about
   4PM. We would prefer to avoid the 24th, if possible.


PARTICIPANT PREPARATION:

    (What preparation is required? Do participants need to bring
    laptops?  If so, do they need to have any particular software?)

    Participants are recommended to bring  and use their own computer, primarily
    for  the second  part  of the  tutorial.  They do  not need  to  set up  any
    particular software---we will do so during the tutorial.


PLANS FOR PUBLICITY:

   (Including, but not limited to, web pages, mailing lists, and
   newsgroups.)

   The  project lives  on GitHub,  where  we plan  to publish  all the  tutorial
   materials  as   well  as  other   information  based  on   the  participants'
   feedback.  We  plan on  announcing  the  tutorial on  Twitter  and  on a  few
   relevant mailing lists---for example, the types-announce@lists.seas.upenn and
   security@fosad.org mailing lists. We also  plan on advertising around several
   groups that we know are interested in this---MIT, TU Darmstadt, University of
   Stuttgart, and others.


ADDITIONAL INFORMATION:

   (If there is any additional information that you would like
   to make us aware of, please include the details here.

   For example, you may wish to indicate a preference for particular
   dates, or that the tutorial should not be run in parallel with
   certain workshops; in such cases, please also include the
   reasons for your preference.)
