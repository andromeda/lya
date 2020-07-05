/**
 * get type string
 * @param val
 * @returns {string}
 */
function getType(val) {
  // `[object Array]`.slice(8, -1) ==> Array
  return Object.prototype.toString.call(val).slice(8, -1);
}

/**
 * check whether arr is an Array of TypedArray
 * @param arr
 * @return bool
 */
function isArray(arr) {
  var type = getType(arr);
  var arrTypes = [
    'Array',
    'Int8Array',
    'Uint8Array',
    'Uint8ClampedArray',
    'Int16Array',
    'Uint16Array',
    'Int32Array',
    'Uint32Array',
    'Float32Array',
    'Float64Array'
  ];

  return arrTypes.indexOf(type) !== -1;

}
module.exports = function chunks(arr, size) {
  if (!isArray(arr)) {
    throw new TypeError('Input should be Array or TypedArray');
  }

  if (typeof size !== 'number') {
    throw new TypeError('Size should be a Number');
  }

  var result = [];
  for (var i = 0; i < arr.length; i += size) {
    if (typeof arr.slice === 'function') {
      result.push(arr.slice(i, size + i));
    } else {
      result.push(arr.subarray(i, size + i));
    }
  }

  return result;
};
