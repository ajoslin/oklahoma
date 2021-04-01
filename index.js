'use strict'

const assert = require('assert')
const mapObject = require('map-obj')
const toArray = require('to-array')
const castArray = require('cast-array')
const PromiseQueue = require('queue-that-promise')
const PromiseSequence = require('./sequence')

module.exports = Oklahoma

function Oklahoma (options) {
  options = options || {}

  assert.ok(options.initial, 'options.initial required')
  assert.ok(options.states, 'options.states required')
  assert.ok(
    options.initial in options.states,
    options.initial + ' is not a valid state'
  )

  let current = options.initial
  const states = mapObject(options.states, mapState)
  const queue = PromiseQueue()

  return {
    current: getCurrent,
    done: done,
    go: go
  }

  function getCurrent () {
    return current
  }

  function done () {
    return queue.done()
  }

  function go (target /*, ...params */) {
    if (!(target in states)) {
      return Promise.reject(
        new Error('Cannot transition to non-existant state ' + target)
      )
    }

    const args = toArray(arguments, 1)

    return queue.add(changeState)

    function changeState () {
      if (getCurrent() === target) return Promise.resolve()

      return Promise.resolve()
        .then(function runLeave () {
          return states[getCurrent()].leave.apply(null, args)
        })
        .then(function runEnter () {
          return states[target].enter.apply(null, args)
        })
        .then(function transitionDone () {
          current = target
        })
        .then(function entered () {
          // These just run, no waiting.
          states[target].entered.apply(null, args)
        })
    }
  }
}

function mapState (id, data) {
  const enterHooks = castArray(data.enter || [])
  const enteredHooks = castArray(data.entered || [])
  const leaveHooks = castArray(data.leave || [])

  return [
    id,
    {
      enter: PromiseSequence(enterHooks),
      entered: PromiseSequence(enteredHooks),
      leave: PromiseSequence(leaveHooks)
    }
  ]
}
