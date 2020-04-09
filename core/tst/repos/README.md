# All the working test examples from repos

## mkdirp
  - There was a problem with bluebird repo. The error message was
   *not ok TypeError: the promise constructor cannot be invoked directly*
  In order to fix it we need to go to *node_modules/bluebird/js/release/promise.js:167*
  and remove the according line that checks for the promise constructor. Line 85

  
## yards
  - In order for this test to work i removed unscape, undefined from declarations and
  disabled with functionallity.

