function sandboxJS(js) {
  const whitelist = ['alert', 'console', 'navigator', 'location'];
  const handlers = {
    get(target, propKey, receiver) {
      console.log('get');
      return Reflect.get(target, propKey, receiver);
    },
    set(target, propKey, value, receiver) {
      console.log('set');
      return Reflect.set(target, propKey, value, receiver);
    },
    has(target, propKey, context) {
      console.log('has');
      return Reflect.has(target, propKey, context);
    },
  };
  const proxy = new Proxy(global, handlers);
  const proxyName = `proxy${Math.floor(Math.random() * 1E9)}`;
  const fn = new Function(proxyName, `with(${proxyName}){${js}}`);
  return fn.call(this, proxy);
}

// sandboxJS("console.log(2)");        // 2
// sandboxJS("console.log(history)");  // Error, Not allowed: history
sandboxJS('x = 3');
console.log('=====');
sandboxJS('x = 4');
console.log('=====');
sandboxJS('console.log(x)');
