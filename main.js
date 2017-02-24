(function () {
  'use strict'
  
  var $ = document.querySelector.bind(document)
  var inputTextarea = $('#textarea_input')
  var goButton = $('#button_go')
  var outputPre = $('#pre_display')
  var worker = new PromiseWorker(new Worker('worker.js'))

  function testScriptLoadTime(src) {
    return new Promise(function (resolve) {
      window.onDone = function onDone(stopEntry) {
        resolve(stopEntry.duration)
      }
      var nonce = btoa(Math.random())
      // random nonce to defeat browser caching and make marks easier to see in timeline
      src += ';var __stopEntry = marky.stop("script_' + nonce + '");onDone(__stopEntry)'
      var script = document.createElement('script')
      script.textContent = src
      marky.mark('script_' + nonce)
      document.body.appendChild(script)
    })
  }


  inputTextarea.textContent = '/* Input your JS here! */\n!function() {\n  console.log(\'hello world\')\n}()'

  goButton.addEventListener('click', function () {
    var src = inputTextarea.textContent
    
    worker.postMessage(src).then(function (optimizedSrc) {
      return testScriptLoadTime(src).then(function (srcLoad) {
        return testScriptLoadTime(optimizedSrc).then(function (optimizedSrcLoad) {
          outputPre.textContent += '\nWithout optimize-js: ' + srcLoad.toFixed(2) + ' ms'
          outputPre.textContent += '\nWith optimize-js   : ' + optimizedSrcLoad.toFixed(2) + ' ms'
        })
      })
    })
  })
})()