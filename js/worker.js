let optimize = require('optimize-js')
let register = require('promise-worker/register')

register(src => optimize(src))
