var validate = require('./lib/validate')
var parse = require('./lib/parse')
var redactor = require('./lib/redactor')
var restorer = require('./lib/restorer')
var groupRedact = require('./lib/modifiers').groupRedact;
var nestedRedact = require('./lib/modifiers').nestedRedact;
var state = require('./lib/state')

var DEFAULT_CENSOR = '[REDACTED]'

module.exports = fastRedact

function fastRedact (opts = {}) {
  const paths = Array.from(new Set(opts.paths || []))
  const serialize = 'serialize' in opts ? opts.serialize : JSON.stringify
  const censor = 'censor' in opts ? opts.censor : DEFAULT_CENSOR

  if (paths.length === 0) {
    if (serialize === false) {
      const wrapper = (o) => o
      wrapper.restore = wrapper
      return wrapper
    } else return serialize
  }

  validate({paths, serialize, censor})

  var wildcards = parse({paths, censor}).wildcards
  var wcLen     = parse({paths, censor}).wcLen 
  var secret    = parse({paths, censor}).secret

  const compileRestore = restorer({secret, wcLen})  

  return redactor({secret, wcLen, serialize}, state({
    secret,
    censor,
    compileRestore,
    serialize,
    groupRedact,
    nestedRedact,
    wildcards,
    wcLen
  }))
}

