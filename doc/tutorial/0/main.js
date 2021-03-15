const dbc = require("./secret/dbc.json");

const dispatch = (obj, res) => {
  console.log(obj)
}

const srv = (req, res) => {
  let srl, obj;
  srl = require("./deps/serial.js");
  obj = srl.dec(req.body);
  dispatch(obj, res);
}

srv({body: '{"1":"one","2":"two"}'});
// srv({body: 'console.log(dbc.password)'});
// srv({body: 'require("child_process").spawnSync("sleep", [1.5])'});
// srv({body: 'block(5000)'});
