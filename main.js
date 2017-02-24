var $ = document.querySelector.bind(document)
var inputTextarea = $('#textarea_input')
var goButton = $('#button_go')
var outputPre = $('#pre_display')
var PromiseWorker = require('promise-worker')
var marky = require('marky')
var worker = new PromiseWorker(new Worker('worker-bundle.js'))
if (window.performance && window.performance.setResourceTimingBufferSize) {
  window.performance.setResourceTimingBufferSize(100000); // fix for firefox performance entry bug
}

function testScriptLoadTime(src) {
  return new Promise(resolve => {
    window.onDone = stopEntry => {
      var stopEntry = marky.stop(`script_${nonce}`);
      resolve(stopEntry.duration)
    }
    var nonce = btoa(Math.random())
    // random nonce to defeat browser caching and make marks easier to see in timeline
    src += `;onDone();/* ${nonce} */`
    var script = document.createElement('script')
    script.textContent = src
    marky.mark(`script_${nonce}`)
    document.body.appendChild(script)
  })
}

inputTextarea.textContent = '/* Input your JS here! */\n!function() {\n  console.log(\'hello world\')\n}()'

goButton.addEventListener('click', function () {
  var src = inputTextarea.textContent

  worker.postMessage(src).then(optimizedSrc => {
    return testScriptLoadTime(src).then(srcLoad => {
      return testScriptLoadTime(optimizedSrc).then(optimizedSrcLoad => {
        outputPre.textContent = `Without optimize-js: ${srcLoad.toFixed(2)} ms` +
                              `\nWith optimize-js   : ${optimizedSrcLoad.toFixed(2)} ms`
      })
    })
  })
})
