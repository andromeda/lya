// A simple analysis / transformation that  (attempts to)
// removes comments in the source code; used only to
// demonstrate `sourceTransform`

// also try google closure compiler
// https://stackoverflow.com/a/3577901
const sourceTransform = (src) => src.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

module.exports = () => {
  return {
    sourceTransform: sourceTransform,
  };
};
