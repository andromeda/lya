//dbc = require("./secret/dbc.json");

var dispatch = (obj, res) => {
  console.log(obj)
}

var srv = (req, res) => {
  let srl, obj;
  srl = require("./deps/serial.js");
  obj = srl.dec(req.body);
  dispatch(obj, res);
}

srv({body: '{"1":"one","2":"two"}'});

