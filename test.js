'use strict'

var test = require('tape')
var Bluebird = require('bluebird')
var toArray = require('to-array')
var Oklahoma = require('./')

test('the basics', function (t) {
  t.plan(3)

  var fsm = Oklahoma({
    initial: 'alpha',
    states: {
      alpha: {
        targets: ['beta']
      },
      beta: {}
    }
  })

  t.equal(fsm.current(), 'alpha')

  fsm.go('beta')
    .then(function () {
      t.equal(fsm.current(), 'beta')

      fsm.go('alpha')
        .then(t.fail)
        .catch(t.pass)
    })
    .catch(t.fail)
})

test('should not run hooks transitioning to current state', function (t) {
  t.plan(1)
  let count = 0

  var fsm = Oklahoma({
    initial: 'init',
    states: {
      init: {
        enter: () => count++
      }
    }
  })

  fsm.go('init')
    .then(() => t.equal(count, 0))
    .catch(t.fail)
})

test('transition to nonexistant state', function (t) {
  t.plan(1)

  var fsm = Oklahoma({
    initial: 'foo',
    states: {
      foo: {}
    }
  })

  fsm.go('invalid')
    .then(t.fail)
    .catch(t.pass)
})

test('parameters passed in to hooks', function (t) {
  t.plan(2)

  var fsm = Oklahoma({
    initial: 'foo',
    states: {
      foo: {
        targets: ['bar'],
        leave: function () {
          t.deepEqual(toArray(arguments), ['arg1', 'arg2'])
        }
      },
      bar: {
        enter: function () {
          t.deepEqual(toArray(arguments), ['arg1', 'arg2'])
        }
      }
    }
  })

  fsm.go('bar', 'arg1', 'arg2')
})

test('sequencing', function (t) {
  var results = []

  function delayResult (text) {
    // Make sure the result
    return Bluebird.delay(Math.random() * 50)
      .then(() => results.push(text))
  }

  var fsm = Oklahoma({
    initial: 'alpha',
    states: {
      alpha: {
        targets: ['beta'],
        leave: () => delayResult('alpha.leave')
      },
      beta: {
        targets: ['gamma'],
        enter: [
          () => delayResult('beta.enter')
        ],
        leave: [
          () => delayResult('beta.leave[0]'),
          () => delayResult('beta.leave[1]')
        ]
      },
      gamma: {}
    }
  })

  t.plan(6)

  fsm.go('beta')
    .then(() => {
      t.deepEqual(results, ['alpha.leave', 'beta.enter'])
      t.equal(fsm.current(), 'beta')
    })

  fsm.go('gamma')
    .then(() => {
      t.deepEqual(results, ['alpha.leave', 'beta.enter', 'beta.leave[0]', 'beta.leave[1]'])
      t.equal(fsm.current(), 'gamma')
    })

  // Cannot transition to alpha from gamma
  fsm.go('alpha')
    .then(t.fail)
    .catch((error) => {
      t.pass(error)
      t.equal(fsm.current(), 'gamma')
    })
})
