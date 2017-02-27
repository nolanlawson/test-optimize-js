/* global Worker, btoa, requestAnimationFrame */

let marky = require('marky')
let PromiseWorker = require('promise-worker')
let worker = new PromiseWorker(new Worker('js/worker-bundle.js'))
let median = require('median')
let fetch = window.fetch || require('unfetch')
let Promise = window.Promise || require('lie')
let STARTING_SCRIPT = '/* Paste your JavaScript here! */\n!function() {\n  console.log(\'hello world\')\n}()'

let $ = document.querySelector.bind(document)
let inputTextarea = $('#textarea_input')
let goButton = $('#button_go')
let outputPre = $('#pre_display')
let iterationsInput = $('#input_iterations')
let commonLibsSelect = $('#select_common_libs')

if (window.performance && window.performance.setResourceTimingBufferSize) {
  window.performance.setResourceTimingBufferSize(100000) // fix for firefox performance entry bug
}

commonLibsSelect.addEventListener('change', e => {
  let url = e.target.value
  if (!e.target.value) {
    inputTextarea.value = STARTING_SCRIPT
    outputPre.textContent = ''
    return
  }

  outputPre.innerText = 'Testing...'
  fetch(url).then(resp => resp.text()).then(src => {
    inputTextarea.value = src
    testScript()
  })
})

function testScriptLoadTimeIteration (src) {
  return new Promise(resolve => {
    window.onDone = () => {
      let stopEntry = marky.stop(`script_${nonce}`)
      Object.keys(window).forEach(key => {
        if (!existingKeys[key]) {
          delete window[key] // undo whatever the script might do to clean up
        }
      })
      resolve(stopEntry.duration)
    }
    let existingKeys = {}
    Object.keys(window).forEach(key => {
      existingKeys[key] = true
    })
    let nonce = btoa(Math.random().toString())
    // random nonce to defeat browser caching
    src += `;onDone();/* ${nonce} */`
    let script = document.createElement('script')
    script.textContent = src
    marky.mark(`script_${nonce}`)
    document.body.appendChild(script)
  })
}

function getIterations () {
  let iterations = parseInt(iterationsInput.value)
  if (iterations <= 0) {
    iterations = 1
  }
  return iterations
}

function testScriptLoadTime (src) {
  let iterations = getIterations()
  let promise = Promise.resolve()
  let durations = []

  function next () {
    return testScriptLoadTimeIteration(src).then(duration => {
      durations.push(duration)
    })
  }

  for (let i = 0; i < iterations; i++) {
    promise = promise.then(next)
  }
  return promise.then(() => {
    let theMedian = median(durations)
    return {
      median: theMedian,
      iterations: iterations
    }
  })
}

function testScript () {
  goButton.disabled = true
  outputPre.innerText = 'Testing...'

  let src = inputTextarea.value

  requestAnimationFrame(() => {
    worker.postMessage(src).then(optimizedSrc => {
      return testScriptLoadTime(src).then(srcLoad => {
        return testScriptLoadTime(optimizedSrc).then(optimizedSrcLoad => {
          outputPre.textContent = `Median of ${srcLoad.iterations} iterations:` +
            `\nWithout optimize-js : ${srcLoad.median.toFixed(2)} ms` +
            `\nWith optimize-js    : ${optimizedSrcLoad.median.toFixed(2)} ms`
          goButton.disabled = false
        })
      })
    }).catch(err => {
      outputPre.textContent = err.message + '\n' + err.stack
      goButton.disabled = false
    })
  })
}

inputTextarea.value = STARTING_SCRIPT

goButton.addEventListener('click', () => testScript())
