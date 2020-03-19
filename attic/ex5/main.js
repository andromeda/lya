require("./variable_usage_control.js");

//Import
let x = require("./testcases/math.js")
let y = require("./testcases/test1.js")
let z = require('./testcases/test2.js')

//Test
x.sub(2,1);
x.add(1,1);
x.add(1,x.pi);
x.fft.add(3,1);

y.print_name();
y.print_surname();

z.print_name();
z.print_surname();

y.print_name();
y.print_surname();

z.print_name();
z.print_surname();
