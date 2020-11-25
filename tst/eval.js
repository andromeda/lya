// Test eval
let eval = new Proxy(global['eval'], {
  apply: function(target, thisArg, argumentsList) {
    console.log('eval');
    var x = Reflect.apply(...arguments);
    return x;
  }}
)
let parseInt = new Proxy(global['parseInt'], {
  apply: function(target, thisArg, argumentsList) {
    console.log('parseInt');
    var l =  Reflect.apply(...arguments);
    return l;
  }}
)
eval('parseInt("F", 16)');
