// Promise
let myFirstPromise = new Promise((resolve, reject) => {
  setTimeout(function(){
    resolve("Success!"); // Yay! Everything went well!
  }, 10);
});
myFirstPromise.then((successMessage) => {
  "Yay! " + successMessage;
});

// Proxy
const handler = {
	get: function(target, name, value) {
	console.log('hahahah')
    return Reflect.get(target, name, value);
  },
};
let test = {};
test = new Proxy(test, handler);
test = 5;

// Undefined
function testUndef(t) {
  if (t === undefined) {
     return 'Undefined value!';
  }
  return t;
}
let x;
testUndef(x);

let m3 = require('./m3.js');

