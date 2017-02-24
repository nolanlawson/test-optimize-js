'use strict'

importScripts('optimize.js', 'https://unpkg.com/promise-worker@1.1.1/dist/promise-worker.register.min.js')

var optimize = self.optimizeJS
var register = self.registerPromiseWorker

register(function (src) {
  var optimized = optimize(src)
  return optimized
})
