const baseTruth = require("./correct.json");
const analysisResult = require("./dynamic.json"); 
const jsonDiff = require("json-diff");

// We check if the base and result has the same stracture
const stracture = (a, b) => {
  console.log(jsonDiff.diffString(a, b, null, {'keysOnly':true}));
};

// If the tests are too quick we just compare the keys
if (JSON.stringify(baseTruth).includes('true')) {
  stracture(baseTruth, analysisResult);
}

