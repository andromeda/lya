#!/usr/local/bin/node

let fs = require("fs");
let join = require("path").join;
let sbx = require("./sbx.js");
const dir = "./js/";

fs.readdir(dir, (error, fileNames) => {
  fileNames.forEach(fileName => {
    fs.readFile(join(dir, fileName), "utf-8", (err, data) => {
      if (err) {
        console.log(err);
        return
      }
      sbx.run(data);
    })
  })
})
