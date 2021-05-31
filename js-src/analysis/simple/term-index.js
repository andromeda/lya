// A simple analysis / transformation that builds an inverted index of the
// set of imports
// could use @olivernn/lunr.js or @weixsong/elasticlunr.js

// Incremental tf-idf calculation
// https://stats.stackexchange.com/a/18925

const stopWords = [
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she',
  'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
  'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of',
  'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
  'don', 'should', 'now'];
// const allTerms = {};
let numDocs = 0;
// map of terms to docs containing a term -- FIXME? explain
// const dted = {};
// map from docs to tf
const docs = {};
const TF = {}; // t -> d -> tf
const IDF = {}; // t -> d -> idf
const Z = {}; // t -> z
// let env;
let TFIDF;
let doc;

const normalize = (word) => word.toLowerCase().replace(/[^\w]/g, '');
const tokenize = (doc) => doc.match(/\w+/g);
const noStop = (e) => !stopWords.includes(e);
const freq = (acc, e, _, arr) => {
  const len = arr.length;
  return Object.assign(acc, {[e]: (e in acc)? acc[e] + (1 / len) : (1 / len)});
};
const tf = (str) => tokenize(str).map(normalize).
    filter(noStop).reduce(freq, {});
const idf = (numDocs, dted) => Math.log(numDocs / (1 + dted)) / Math.log(10);

const sourceTransform = (src, id) => {
  numDocs++;
  const terms = tf(src);
  docs[id] = terms;
  for (const term in terms) {
    if (Object.prototype.hasOwnProperty.call(terms, term)) {
      // calculate TF
      if (TF[term]) {
        TF[term][id] = terms[term];
      } else {
        TF[term] = {[id]: terms[term]};
      }

      // calculate Z
      Z[term] = Z[term]? Z[term] + 1 : 1;

      // calculate IDF
      if (IDF[term]) {
        for (const doc in IDF[term]) {
          if (Object.prototype.hasOwnProperty.call(IDF[term], doc)) {
            IDF[term][doc] = idf(numDocs, Z[term]);
            TFIDF[term][doc] = TF[term][id] * IDF[term][doc];
          }
        }
      } else {
        IDF[term] = {[id]: idf(numDocs, Z[term])};
        TFIDF[term] = {[id]: TF[term][id] * IDF[term][doc]};
      }
    }
  }
  // return the original source
  return src;
};

const onExit = (intersection, candidateModule) => {
  // let obj = sortByIDF();
  console.log(TFIDF);
};

module.exports = (e) => {
  // env = e;
  return {
    sourceTransform: sourceTransform,
    onExit: onExit,
  };
};
