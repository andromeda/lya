const diff = require('arr-diff');

diff(['x', 'b', 'c', 'e', 'y'], ['b', 'x', 'e']);
diff(['x', 'x'], ['a', 'b', 'c']);
diff(['x'], ['a', 'b', 'c']);
