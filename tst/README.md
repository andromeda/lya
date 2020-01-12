# Description of Test Cases

Multiple test cases. The working directory containts all the test cases that work fine and the not working directory contains the test cases that we need to fix. 

## We can check them against jalangi
https://github.com/SRA-SiliconValley/jalangi

A working docker container with jalangi installed:
https://hub.docker.com/r/hrishikeshrt/jalangi

docker pull hrishikeshrt/jalangi

docker run -t -i hrishikeshrt/jalangi /bin/bash

docker start -i "name of the create container"

## TODO:

Compare with Jalangi on a very simple analysis:
* built-ins -- identify what built-in functionality a module is using; for example `Array`, `Math.add`, `require`, etc.
* globals -- identify which global variables a module is accessing; for example `x`, `globals.x` etc.

_On top of that, we should have an example of runtime code evaluation. My suspition is that J2 cannot detect runtime code evaluation the same way we can (by wrapping objects), but we should verify._
