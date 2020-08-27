We welcome code contributions!

Any  contribution   is  very  welcome  —   code,  documentation,  applications,
tutorials! These guidelines were put together to help you make contributions.

## Reporting

We  can   only  fix  issues   we  know  about.   Thus,  feel  free   to  [report
liberally](https://github.com/andromeda/lya/issues/new);  please  make  an
effort to report issues to the right repository.

## Code Conventions

We   follow   the   JavaScript   conventions   as   described   by   the
[Google JS  Style](http://javascript.crockford.com/code.html). Code  should pass
[ESLint](http://eslint.org) and tests  _before_ committing, so that  we have the
master branch clean. In  the top level shell  directory, you can  run `npm
test` — this  will run both the linter  and tests. To run only  the linter `npm
run l`. Generally, you can always use a pre-commit hook.

## Commit Messages

Keep  the first  line  of the  commit  message  under 72  characters  — it's  a
summary. Also,  write everything  in the  imperative: "Fix  bug" and  not "Fixed
bug"  or "Fixes  bug."  Also, link  it  to  the issue  you're  working on  ([see
below](#issue-tracking)), by adding  the issue ID prefixed by  the `#` character
at the end of your message (_e.g._, `#123`).

For a 2-minute guide on commit messages, read [Tim Pope's](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html) guidelines.

## Picking Tickets

Make sure you leave a reply to the  issue on you are starting to work on stating
that you're looking into it so that other people do not duplicate your effort —
and feel  free to  ask for help  on the  [the mailing list](lya-discuss@googlegroups.com)!

`teesnsy`: Issues marked  as "teensy"  are  a  great place  to  start.  

