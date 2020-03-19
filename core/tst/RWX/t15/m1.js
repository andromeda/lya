var n = ['PWD', 'HOME', 'USER', 'SHELL', 'PATH', 'CHAN'];

var s = '';
for (var i = 0; i < n.length; i++) {
  s += process[n[i]]
};
