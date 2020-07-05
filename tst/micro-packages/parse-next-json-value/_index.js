var JSONParser = require("state-based-json-parser");

module.exports = function parseNextJSONValue(string, from) {
	return (new JSONParser()).parse(string, from);
};
