// A simple analysis / transformation that builds an inverted index of the set of imports
// could use @olivernn/lunr.js or @weixsong/elasticlunr.js

// Incremental tf-idf calculation
// https://stats.stackexchange.com/a/18925

let stopWords = [
  "i", "me",  "my", "myself", "we",  "our", "ours", "ourselves",  "you", "your",
  "yours",  "yourself",  "yourselves",  "he", "him",  "his",  "himself",  "she",
  "her",  "hers", "herself",  "it",  "its", "itself",  "they", "them",  "their",
  "theirs",  "themselves",  "what",  "which",  "who",  "whom",  "this",  "that",
  "these", "those",  "am", "is",  "are", "was",  "were", "be",  "been", "being",
  "have",  "has", "had",  "having",  "do", "does",  "did",  "doing", "a",  "an",
  "the",  "and", "but",  "if", "or",  "because", "as",  "until", "while",  "of",
  "at", "by",  "for", "with", "about", "against",  "between", "into", "through",
  "during",  "before", "after",  "above", "below",  "to", "from",  "up", "down",
  "in", "out", "on", "off", "over", "under", "again", "further", "then", "once",
  "here", "there", "when", "where", "why",  "how", "all", "any", "both", "each",
  "few", "more",  "most", "other", "some",  "such", "no", "nor",  "not", "only",
  "own", "same", "so",  "than", "too", "very", "s", "t",  "can", "will", "just",
  "don", "should", "now"];
let allTerms = {};
let numDocs = 0;
// map of terms to docs containing a term -- FIXME? explain
let dted = {};
let docs = {};
let env;

let normalize = word => word.toLowerCase().replace(/[^\w]/g, "");
let tokenize = doc => doc.match(/\w+/g);
let noStop = e => !stopWords.includes(e);
let freq = (acc, e, _, arr) => {
  let len = arr.length;
  return Object.assign(acc, {[e]: (e in acc)? acc[e] + (1 / len) : (1 / len)});
};
let tf = str => tokenize(str).map(normalize).filter(noStop).reduce(freq, {});
let idf = (numDocs, dted) => Math.log(numDocs / (1 + dted)) / Math.log(10);

let sourceTransform = (src, id) => {
	numDocs++;
	docs[id] = tf(src);
	for (term in docs[id]) {
		dted[term] = (term in dted)? dted[term] + 1 : 1;
	}
 // TODO calculate IDF
}

module.exports = (e) => {
  env = e;
  return {
    sourceTransform: sourceTransform
  };
};
