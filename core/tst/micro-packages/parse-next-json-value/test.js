var tape = require("tape");
var parseNextJSONValue = require("./index.js");

tape("parse value", function(test) {
	test.deepEqual(parseNextJSONValue(""), { value: undefined, index: 0, errorCode: "MISSING_VALUE" }, "Fail parse <>");
	test.end();
});

tape("parse true", function(test) {
	test.deepEqual(parseNextJSONValue("true"), { value: true, index: 4 }, "Parse <true>");
	test.deepEqual(parseNextJSONValue("true2"), { value: true, index: 4 }, "Parse <true2>");
	test.deepEqual(parseNextJSONValue("true "), { value: true, index: 5 }, "Parse <true >");
	test.deepEqual(parseNextJSONValue(" true "), { value: true, index: 6 }, "Parse < true >");
	test.deepEqual(parseNextJSONValue("true \t \n"), { value: true, index: 8 }, "Parse <true \\t \\n>");
	test.deepEqual(parseNextJSONValue("   true \t \n"), { value: true, index: 11 }, "Parse <   true \\t \\n>");
	test.deepEqual(parseNextJSONValue("tru"), { value: undefined, index: 0, errorCode: "MISSING_VALUE" }, "Fail parse <tru>");
	test.deepEqual(parseNextJSONValue("  tru"), { value: undefined, index: 2, errorCode: "MISSING_VALUE" }, "Fail parse <  tru>");
	test.deepEqual(parseNextJSONValue("True"), { value: undefined, index: 0, errorCode: "MISSING_VALUE" }, "Fail parse <True>");
	test.end();
});

tape("parse false", function(test) {
	test.deepEqual(parseNextJSONValue("false"), { value: false, index: 5 }, "Parse <false>");
	test.deepEqual(parseNextJSONValue("false2"), { value: false, index: 5 }, "Parse <false2>");
	test.deepEqual(parseNextJSONValue("false "), { value: false, index: 6 }, "Parse <false >");
	test.deepEqual(parseNextJSONValue("\tfalse "), { value: false, index: 7 }, "Parse <\tfalse >");
	test.deepEqual(parseNextJSONValue("false\t\n\r"), { value: false, index: 8 }, "Parse <false\\t\\n\\r>");
	test.deepEqual(parseNextJSONValue("\r\nfalse\t\n\r"), { value: false, index: 10 }, "Parse <\\r\\nfalse\\t\\n\\r>");
	test.deepEqual(parseNextJSONValue("fals"), { value: undefined, index: 0, errorCode: "MISSING_VALUE" }, "Fail parse <fals>");
	test.deepEqual(parseNextJSONValue("\t\t\tfals"), { value: undefined, index: 3, errorCode: "MISSING_VALUE" }, "Fail parse <\\t\\t\\tfals>");
	test.deepEqual(parseNextJSONValue("False"), { value: undefined, index: 0, errorCode: "MISSING_VALUE" }, "Fail parse <False>");
	test.end();
});

tape("parse null", function(test) {
	test.deepEqual(parseNextJSONValue("null"), { value: null, index: 4 }, "Parse <null>");
	test.deepEqual(parseNextJSONValue("null2"), { value: null, index: 4 }, "Parse <null2>");
	test.deepEqual(parseNextJSONValue("null "), { value: null, index: 5 }, "Parse <null >");
	test.deepEqual(parseNextJSONValue("\nnull "), { value: null, index: 6 }, "Parse <\\nnull >");
	test.deepEqual(parseNextJSONValue("null\t\t\t "), { value: null, index: 8 }, "Parse <null\\t\\t\\t >");
	test.deepEqual(parseNextJSONValue("\t\t\tnull\t\t\t "), { value: null, index: 11 }, "Parse <\\t\\t\\tnull\\t\\t\\t >");
	test.deepEqual(parseNextJSONValue("nul"), { value: undefined, index: 0, errorCode: "MISSING_VALUE" }, "Fail parse <nul>");
	test.deepEqual(parseNextJSONValue("\nnul"), { value: undefined, index: 1, errorCode: "MISSING_VALUE" }, "Fail parse <\\nnul>");
	test.deepEqual(parseNextJSONValue("Null"), { value: undefined, index: 0, errorCode: "MISSING_VALUE" }, "Fail parse <Null>");
	test.end();
});

tape("parse numbers", function(test) {
	test.deepEqual(parseNextJSONValue("0"), { value: 0, index: 1 }, "Parse <0>");
	test.deepEqual(parseNextJSONValue("-0"), { value: -0, index: 2 }, "Parse <-0>");
	test.deepEqual(parseNextJSONValue("00"), { value: 0, index: 1 }, "Parse <00> (result is another 0 remaining)");
	test.deepEqual(parseNextJSONValue("0.0"), { value: 0.0, index: 3 }, "Parse <0.0>");
	test.deepEqual(parseNextJSONValue("0.3e2"), { value: 30, index: 5 }, "Parse <0.3e2>");
	test.deepEqual(parseNextJSONValue("0.3e+2"), { value: 30, index: 6 }, "Parse <0.3e+2>");
	test.deepEqual(parseNextJSONValue("0.3e-2"), { value: 0.003, index: 6 }, "Parse <0.3e-2>");
	test.deepEqual(parseNextJSONValue("0e-2"), { value: 0, index: 4 }, "Parse <0e-2>");
	test.deepEqual(parseNextJSONValue("123"), { value: 123, index: 3 }, "Parse <123>");
	test.deepEqual(parseNextJSONValue("123e2"), { value: 12300, index: 5 }, "Parse <123e2>");
	test.deepEqual(parseNextJSONValue("123e+2"), { value: 12300, index: 6 }, "Parse <123e+2>");
	test.deepEqual(parseNextJSONValue("123e-2"), { value: 1.23, index: 6 }, "Parse <123e-2>");
	test.deepEqual(parseNextJSONValue("123.456e1"), { value: 1234.56, index: 9 }, "Parse <123.456e1>");
	test.deepEqual(parseNextJSONValue("123.456e+1"), { value: 1234.56, index: 10 }, "Parse <123.456e+1>");
	test.deepEqual(parseNextJSONValue("123.456e-1"), { value: 12.3456, index: 10 }, "Parse <123.456e-1>");
	test.deepEqual(parseNextJSONValue("123.456e-1"), { value: 12.3456, index: 10 }, "Parse <123.456e-1>");
	test.deepEqual(parseNextJSONValue("-0.0"), { value: -0.0, index: 4 }, "Parse <-0.0>");
	test.deepEqual(parseNextJSONValue("-0.3e2"), { value: -30, index: 6 }, "Parse <-0.3e2>");
	test.deepEqual(parseNextJSONValue("-0.3e+2"), { value: -30, index: 7 }, "Parse <-0.3e+2>");
	test.deepEqual(parseNextJSONValue("-0.3e-2"), { value: -0.003, index: 7 }, "Parse <-0.3e-2>");
	test.deepEqual(parseNextJSONValue("-123"), { value: -123, index: 4 }, "Parse <-123>");
	test.deepEqual(parseNextJSONValue("-123e2"), { value: -12300, index: 6 }, "Parse <-123e2>");
	test.deepEqual(parseNextJSONValue("-123e+2"), { value: -12300, index: 7 }, "Parse <-123e+2>");
	test.deepEqual(parseNextJSONValue("-123e-2"), { value: -1.23, index: 7 }, "Parse <-123e-2>");
	test.deepEqual(parseNextJSONValue("-123.456e1"), { value: -1234.56, index: 10 }, "Parse <-123.456e1>");
	test.deepEqual(parseNextJSONValue("-123.456e+1"), { value: -1234.56, index: 11 }, "Parse <-123.456e+1>");
	test.deepEqual(parseNextJSONValue("-123.456e-1"), { value: -12.3456, index: 11 }, "Parse <-123.456e-1>");
	test.deepEqual(parseNextJSONValue("-123.456e-1"), { value: -12.3456, index: 11 }, "Parse <-123.456e-1>");
	test.deepEqual(parseNextJSONValue("-"), { value: undefined, index: 1, errorCode: "INVALID_NUMBER" }, "Fail parse <->");
	test.deepEqual(parseNextJSONValue("0."), { value: undefined, index: 2, errorCode: "INVALID_NUMBER_FRACTION" }, "Fail parse <0.>");
	test.deepEqual(parseNextJSONValue("0.e2"), { value: undefined, index: 2, errorCode: "INVALID_NUMBER_FRACTION" }, "Fail parse <0.e2>");
	test.deepEqual(parseNextJSONValue(".3"), { value: undefined, index: 0, errorCode: "MISSING_VALUE" }, "Fail parse <.3>");
	test.deepEqual(parseNextJSONValue("7e"), { value: undefined, index: 2, errorCode: "INVALID_NUMBER_EXPONENT" }, "Fail parse <7e>");
	test.deepEqual(parseNextJSONValue("7e+"), { value: undefined, index: 3, errorCode: "INVALID_NUMBER_EXPONENT" }, "Fail parse <7e+>");
	test.deepEqual(parseNextJSONValue("7e-"), { value: undefined, index: 3, errorCode: "INVALID_NUMBER_EXPONENT" }, "Fail parse <7e->");
	test.end();
});

tape("parse strings", function(test) {
	test.deepEqual(parseNextJSONValue("\"\""), { value: "", index: 2 }, "Parse <\"\">");
	test.deepEqual(parseNextJSONValue("\"hello\""), { value: "hello", index: 7 }, "Parse <\"hello\">");
	test.deepEqual(parseNextJSONValue("\"hello\\nworld\""), { value: "hello\nworld", index: 14 }, "Parse <\"hello\\nworld\">");
	test.deepEqual(parseNextJSONValue("\"\\\"\\t\\n\\r\\f\\b\\\\\\/\""), { value: "\"\t\n\r\f\b\\/", index: 18 }, "Parse <\"\\t\\n\\r\\f\\b\\\\\\\\/\">");
	test.deepEqual(parseNextJSONValue("\"\\\\\\\\\\n\""), { value: "\\\\\n", index: 8 }, "Parse <\"\\\\\\\\\\n\">");
	test.deepEqual(parseNextJSONValue("\"hello \\u005c\""), { value: "hello \\", index: 14 }, "Parse <\"hello \\u005c\">");
	test.deepEqual(parseNextJSONValue("\"hello \\u005C\""), { value: "hello \\", index: 14 }, "Parse <\"hello \\u005C\">");
	test.deepEqual(parseNextJSONValue("\"hello \\uD834\\uDD1E\""), { value: "hello " + String.fromCharCode(Number.parseInt("D834", 16), Number.parseInt("DD1E", 16)), index: 20 }, "Parse <\"hello \\uD834\\uDD1E\">");
	test.deepEqual(parseNextJSONValue("\"𐐏\""), { value: "𐐏", index: 4 }, "Parse <\"𐐏\"> (surrogate char -> 2 positions)");
	test.deepEqual(parseNextJSONValue("\"hello"), { value: undefined, index: 6, errorCode: "INVALID_STRING" }, "Fail parse <\"hello>");
	test.deepEqual(parseNextJSONValue("\"hello\\"), { value: undefined, index: 7, errorCode: "INVALID_ESCAPE_CHAR" }, "Fail parse <\"hello\\>");
	test.deepEqual(parseNextJSONValue("\"hello\\x\""), { value: undefined, index: 7, errorCode: "INVALID_ESCAPE_CHAR" }, "Fail parse <\"hello\\x\">");
	test.deepEqual(parseNextJSONValue("\"hello\\u005C"), { value: undefined, index: 12, errorCode: "INVALID_STRING" }, "Fail parse <\"hello\\u005C>");
	test.deepEqual(parseNextJSONValue("\"hello\\u005G\""), { value: undefined, index: 11, errorCode: "INVALID_UNICODE_HEX_STRING" }, "Fail parse <\"hello\\u005G\">");
	test.deepEqual(parseNextJSONValue("\"hello \\uD834\\u001E\""), { value: undefined, index: 19, errorCode: "MISSING_HIGH_SURROGATE" }, "Fail parse <\"hello \\uD834\\u001E\"> (invalid high surrogate)");
	test.deepEqual(parseNextJSONValue("\"hello \\uD834"), { value: undefined, index: 13, errorCode: "MISSING_HIGH_SURROGATE" }, "Fail parse <\"hello \\uD834> (invalid high surrogate)");
	test.deepEqual(parseNextJSONValue("\"hello \\uD834\\"), { value: undefined, index: 14, errorCode: "MISSING_HIGH_SURROGATE" }, "Fail parse <\"hello \\uD834\\> (invalid high surrogate)");
	test.end();
});

tape("parse objects", function(test) {
	test.deepEqual(parseNextJSONValue("[]"), { value: [], index: 2 }, "Parse empty array");
	test.deepEqual(parseNextJSONValue("[]\n\n"), { value: [], index: 4 }, "Parse empty array with whitespace (after)");
	test.deepEqual(parseNextJSONValue("[ \t   \n \n]  \n"), { value: [], index: 13 }, "Parse empty array with whitespace (between and after)");
	test.deepEqual(parseNextJSONValue("   [ \t  \n ] \n"), { value: [], index: 13 }, "Parse empty array with whitespace (before, between and after)");
	test.deepEqual(parseNextJSONValue("[null]"), { value: [ null ], index: 6 }, "Parse array with single null");
	test.deepEqual(parseNextJSONValue("[ null , null ]"), { value: [ null, null ], index: 15 }, "Parse array with two null's");
	test.deepEqual(parseNextJSONValue("[[]]"), { value: [ [] ], index: 4 }, "Parse array with empty array");
	test.deepEqual(parseNextJSONValue("[[[[[[[[[[[[]]]]]]]]]]]]"), { value: [[[[[[[[[[[[]]]]]]]]]]]], index: 24 }, "Parse array with empty array ... repeatedly");
	test.deepEqual(parseNextJSONValue("[[[[[[[[[[[[]]]]]]]]]]]]]"), { value: [[[[[[[[[[[[]]]]]]]]]]]], index: 24 }, "Parse array with empty array ... repeatedly (one close bracket remaining)");
	test.deepEqual(parseNextJSONValue("[ true, false "), { value: undefined, index: 14, errorCode: "INVALID_ARRAY" }, "Fail parse array without closing bracket");
	test.deepEqual(parseNextJSONValue("[ true false ]"), { value: undefined, index: 7, errorCode: "INVALID_ARRAY" }, "Fail parse array elements without comma");
	test.deepEqual(parseNextJSONValue("[ unknown ]"), { value: undefined, index: 2, errorCode: "MISSING_VALUE" }, "Fail parse array without valid value");
	test.end();
});

tape("parse objects", function(test) {
	test.deepEqual(parseNextJSONValue("{}"), { value: {}, index: 2 }, "Parse empty object");
	test.deepEqual(parseNextJSONValue("{}\n\n"), { value: {}, index: 4 }, "Parse empty object with whitespace (after)");
	test.deepEqual(parseNextJSONValue("{ \t   \n \n}  \n"), { value: {}, index: 13 }, "Parse empty object with whitespace (between and after)");
	test.deepEqual(parseNextJSONValue("   { \t  \n } \n"), { value: {}, index: 13 }, "Parse empty object with whitespace (before, between and after)");
	test.deepEqual(parseNextJSONValue("{ \"hello\": false }"), { value: { "hello": false }, index: 18 }, "Parse object with single member");
	test.deepEqual(parseNextJSONValue("{ \"a\": false, \"b\": true }"), { value: { "a": false, "b": true }, index: 25 }, "Parse object with two members");
	test.deepEqual(parseNextJSONValue("{ \"hello"), { value: undefined, index: 8, errorCode: "INVALID_MEMBER_NAME" }, "Fail parse member name incomplete");
	test.deepEqual(parseNextJSONValue("{ \"hello\\x\": false }"), { value: undefined, index: 9, errorCode: "INVALID_MEMBER_NAME" }, "Fail parse member name invalid escape char");
	test.deepEqual(parseNextJSONValue("{ \"hello\": fals }"), { value: undefined, index: 11, errorCode: "MISSING_VALUE" }, "Fail parse member value unknown literal");
	test.deepEqual(parseNextJSONValue("{ \"hello\" }"), { value: undefined, index: 10, errorCode: "MISSING_COLON" }, "Fail parse colon missing");
	test.deepEqual(parseNextJSONValue("{ \"hello\" : }"), { value: undefined, index: 12, errorCode: "MISSING_VALUE" }, "Fail parse member value missing");
	test.deepEqual(parseNextJSONValue("{ hello : true }"), { value: undefined, index: 2, errorCode: "MISSING_MEMBER_NAME" }, "Fail parse member name without quotes");
	test.deepEqual(parseNextJSONValue("{ \"a\": \"a\" \"b\": \"b\" }"), { value: undefined, index: 11, errorCode: "INVALID_OBJECT" }, "Fail parse members without comma separator");
	test.end();
});

tape("parse combined", function(test) {
	test.deepEqual(parseNextJSONValue("[{}]"), { value: [{}], index: 4 }, "Parse array empty object");
	test.end();
});
