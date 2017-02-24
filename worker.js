var optimize = require('optimize-js')
var register = require('promise-worker/register')

register(src => optimize(src))
