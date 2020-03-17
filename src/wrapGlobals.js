
// https://2ality.com/2016/11/trace-globals-proxy.html
let _glob;
if (typeof global !== 'undefined') {
  _glob = global;
  console.log("pointing _glob to global");
} else {
  _glob = self;
  console.log("pointing _glob to self");
}

function evalCode(code) {
    const func = new Function ("proxy", "with (proxy) {" + code + "}");
    const proxy = new Proxy(_glob, {
        get(target, propKey, receiver) {
            console.log(`GET ${String(propKey)}`); // (B)
            return Reflect.get(target, propKey, receiver);
        },
        set(target, propKey, value, receiver) { // (C)
            console.log(`SET ${String(propKey)}=${value}`);
            return Reflect.set(target, propKey, value, receiver);
        },
    });
    return func(proxy);
}

evalCode('x = 3')
console.log(x)
