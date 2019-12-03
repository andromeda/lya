//
// deperacted
// "escape", 
// "EvalError",

const arr = Array.of(1, 2, 3);
//const buffer = new SharedArrayBuffer(16);
const buffer = new ArrayBuffer(16);
const uint8 = new Uint8Array(arr);
//Atomics.add(uint8, 0, 2);

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
//	"Float32Array",
//	"Float64Array",
//	"Function",
//	"hasOwnProperty",
//	"Infinity",
//	"Int16Array",
//	"Int32Array",
//	"Int8Array",
//	"isFinite",
//	"isNaN",
//	"isPrototypeOf",
//	"JSON",
//	"Map",
//	"Math",
//	"NaN",
//	"Number",
//	"Object",
//	"parseFloat",
//	"parseInt",
//	"Promise",
//	"propertyIsEnumerable",
//	"Proxy",
//	"RangeError",
//	"ReferenceError",
//	"Reflect",
//	"RegExp",
//	"Set",
//	"String",
//	"Symbol",
//	"SyntaxError",
//	"toLocaleString",
//	"toString",
//	"TypeError",
//	"Uint16Array",
//	"Uint32Array",
//	"Uint8Array",
//	"Uint8ClampedArray",
//	"undefined",
//	"unescape",
//	"URIError",
//	"valueOf",
//	"WeakMap",
//	"WeakSet"

// Not compatible with Node v8.9.4 --version we are using
// *******************************************************************************
// "Atomics" -> 8.10.0
// "SharedArrayBuffer" -> 8.10.0
// "BigInt"  -> 10.4.0
// "BigInt64Array" -> 10.4.0