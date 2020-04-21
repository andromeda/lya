// TODO: This should not fail with 'with' enabled
// replicate this error by "withEnable: true"
var process = {env: {}}

process.env.CHAN = 3
process.env.PWD  = "?"
process.env.HOME  = "?"
process.env.USER  = "?"
process.env.SHELL  = "?"
process.env.PATH  = "?"
process.env.CHAN  = "?"
