# Benchmarks

These benchmarks are taken from [the benchmarks
game](https://benchmarksgame-team.pages.debian.net/) and are used here to
benchmark the impact of `safe-require` on a whole program level.

`create.rkt` is currently used to generate the raw timing data. It’s relatively
primitive, but since we’re mostly interested in relative time differences
rather than exact times this should be sufficient.

`create-safe.rkt` is the safe equivalent. The patches are currently applied
manually.

<hr/>

Have fun!
