const fsPath = require('fs-path');
const source = '/bin/ls';
const target =  '/tmp/foo;rm\t/tmp/foo;whoami>\t/tmp/bar';
fsPath.copySync(source, target);
