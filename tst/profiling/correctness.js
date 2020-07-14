const baseTruth = require("./correct.json");
const analysisResult = require("./dynamic.json"); 
const jsonDiff = require("json-diff");

var sBase = [];
var sAnalysis = [];

// We check if the base and result has the same stracture
const stracture = (a, b) => {
  console.log(jsonDiff.diffString(a, b, null, {'keysOnly':true}));
};

// If the tests are too quick we just compare the keys
if (JSON.stringify(baseTruth).includes('true')) {
  stracture(baseTruth, analysisResult);
  return;
}

// We sort the json file and create a sorted array
const sortAdd = (json, array) => {
  for (a in json) {
    const temp = (Object.entries(json[a]))
    for (b in temp) {
      array.push(temp[b]);
    }
  };
  
  array.sort(function(a, b) {return a[1] - b[1]});
  array.reverse();
}

const compare = (a, b) => {
  for (count in a) {
    if (a[count][1] === 0) {
      return
    }
    
    if (a[count][0] !== b[count][0]) {
      console.log('Mismatch in times of:', a[count], b[count])
    }
  }
}

stracture(baseTruth, analysisResult);
sortAdd(baseTruth, sBase);
sortAdd(analysisResult, sAnalysis);

compare(sBase, sAnalysis);
