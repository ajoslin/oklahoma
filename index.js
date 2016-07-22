'use strict'

var assert = require('assert')
var mapObject = require('map-obj')
var toArray = require('to-array')
var castArray = require('cast-array')
var partial = require('ap').partial
var PromiseQueue = require('queue-that-promise')
var PromiseSequence = require('./sequence')

module.exports = Oklahoma

function Oklahoma (options) {
  options = options || {}

  assert.ok(options.initial, 'options.initial required')
  assert.ok(options.states, 'options.states required')
  assert.ok(options.initial in options.states, options.initial + ' is not a valid state')

  var current = options.initial
  var states = mapObject(options.states, mapState)
  var queue = PromiseQueue()

  return {
    current: getCurrent,
    go: go
  }

  function getCurrent () {
    return current
  }

  function go (target/*, ...params*/) {
    if (!(target in states)) {
      return Promise.reject(new Error('Cannot transition to non-existant state ' + target))
    }

    var params = [target].concat(toArray(arguments, 1))

    return queue.add(changeState)

    function changeState () {
      return Promise.resolve()
        .then(function runLeave () {
          return states[getCurrent()].leave.apply(null, params)
        })
        .then(function runEnter () {
          return states[target].enter.apply(null, params)
        })
        .then(function transitionDone () {
          current = target
        })
    }
  }
}

function mapState (id, data) {
  var enterHooks = castArray(data.enter || [])
  var leaveHooks = castArray(data.leave || [])

  return [id, {
    id: id,
    enter: PromiseSequence(enterHooks),
    leave: PromiseSequence([
      partial(validateTransition, id, data.targets || [])
    ].concat(leaveHooks))
  }]
}

function validateTransition (from, validTargets, to) {
  assert.ok(validTargets.indexOf(to) !== -1, 'Cannot transition to ' + to + ' from ' + from)
}
