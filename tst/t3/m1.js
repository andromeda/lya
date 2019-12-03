//
// deperacted
// "escape", 
// "EvalError",

const arr = Array.of(1, 2, 3);
const buffer = new ArrayBuffer(16);
const testFloat32 = new Float32Array(12);
const testFloat64 = new Float64Array(12);

var adder = new Function('a', 'b', 'return a + b');

// hasOwnProperty 
const object1 = new Object();
object1.property1 = 42;
object1.hasOwnProperty('property1');

// Infinity
const maxNumber = Math.pow(10, 1000); // max positive number
if (maxNumber === Infinity) {
}

const testInt16Array = new Int16Array(2);
const testInt32Array = new Int32Array(2);
const testInt8Array = new Int8Array(2);

isFinite(Infinity);  // false
isNaN(NaN);       // true

// isPrototypeOf
function object11() {}
function object22() {}
object11.prototype = Object.create(object22.prototype);
const object33 = new object11();
object11.prototype.isPrototypeOf(object33);
object22.prototype.isPrototypeOf(object33);

// JSON
let code = '"\u2028\u2029"';
JSON.parse(code); // evaluates to "\u2028\u2029" in all engines
//eval(code); // throws a SyntaxError in old engines

var myMap = new Map();

// Math
Math.abs(5 - 8);
Math.exp(0)

isNaN(NaN);

let a = new Number('123')
let o = new Object()
const set1 = new Set([1, 2, 3, 4, 5]);
var s_obj = new String('foo');
var sym2 = Symbol('foo');

const number1 = 123456.789;
number1.toLocaleString('de-DE');

// toString
var testToString = new Object();
testToString.toString(); // returns [object Object]

var str = "Hello World!";
var res = str.valueOf(); 

parseFloat(4.24342423)
parseInt(1231)

var uint8 = new Uint8Array(arr);
var uint16 = new Uint16Array(2);
var uint32 = new Uint32Array(2);
var uintc8 = new Uint8ClampedArray(2);

unescape('abc123');     // "abc123"

let m2 = require("./m2.js");

//const buffer = new SharedArrayBuffer(16);
//const alsoHuge = BigInt(9007199254740991);
//const bigint64 = new BigInt64Array(2);

const b = new Boolean(false);

//	"constructor", Works
const view1 = new DataView(buffer);
const date1 = new Date('December 17, 1995 03:24:00');
const uri = 'https://mozilla.org/?x=шеллы';
const r = encodeURI( encodeURIComponent( decodeURI( encodeURI(uri) ) ) );

// Both works!
const x = Error('I was created using a function call!');
const y = new Error('I was constructed via the "new" keyword!');
const er = eval('2 + 2');

// TODO: Add code for the rest; take examples from the following URL, by
// replacing XXX with individual strings in quotes below:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/XXX
//
//	"hasOwnProperty",	-- prints object but not this function
//	"Infinity",	-- doesnt print
//	"isPrototypeOf",	--works but doesnt print
//	"JSON",	--works but doesnt print
//	"Math",	--works but doesnt print
//	"NaN",	--works but doesnt print
//	"propertyIsEnumerable",
//	"Proxy", --works but doesnt print
//	"Reflect",--works but doesnt print
//	"toLocaleString",--works but doesnt print
//	"toString", --works but doesnt print
//	"undefined", --works but doesnt print
//	"valueOf",	--works but doesnt print

// Not compatible with Node v8.9.4 --version we are using
// *******************************************************************************
// "Atomics" -> 8.10.0
// "SharedArrayBuffer" -> 8.10.0
// "BigInt"  -> 10.4.0
// "BigInt64Array" -> 10.4.0