module.exports = function leftPad(s, size, ch){
  if(s.length >= size) return s;
  if(ch === undefined) ch = ' ';
  var pad = new Array(size - s.length).fill(ch).join('');
  return pad + s;
}
