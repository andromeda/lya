const baseTruth = require("./correct.json");
const analysisResult = require("./dynamic.json"); 
const jsonDiff = require("json-diff");

// If the tests are too quick we just compare the keys
if (JSON.stringify(baseTruth).includes('true')) {
  console.log(jsonDiff.diffString(baseTruth, analysisResult, null, {'keysOnly':true}));
}

