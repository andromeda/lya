import test from 'ava';
import arrayChunks from './';

test('size smaller than array length', t => {
  t.same(arrayChunks([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

test('size larger than array length', t => {
  t.same(arrayChunks([1, 2, 3, 4, 5], 6), [[1, 2, 3, 4, 5]]);
});

test('work with TypedArray', t => {
  if (Int8Array !== undefined) {
    arrayChunks(new Int8Array([1, 2, 3, 4, 5]), 2)
    .forEach((item, idx) => {
      if (idx !== 2) {
        t.same(item.length, 2);
      } else {
         t.same(item.length, 1);
      }
    })
  } else {
     t.pass();
  }
});

test('throw error when passed in non-array variable', t => {
  t.throws(() => {
    arrayChunks(123, 4);
  }, 'Input should be Array or TypedArray');

  t.notThrows(() => {
    arrayChunks([123], 4);
  });
});

