var toArray = require('to-array')

module.exports = PromiseSequence

function PromiseSequence (callbacks) {
  return function runSequence () {
    var args = toArray(arguments)

    return callbacks.reduce(function runCallbacks (acc, callback) {
      return acc.then(function runCallback () {
        return callback.apply(null, args)
      })
    }, Promise.resolve())
  }
}
