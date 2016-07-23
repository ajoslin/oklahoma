# oklahoma [![Build Status](https://travis-ci.org/ajoslin/oklahoma.svg?branch=master)](https://travis-ci.org/ajoslin/oklahoma)

> Minimal promise-based finite state manager

## Install

```
$ npm install --save oklahoma
```

## Usage

```js
var Oklahoma = require('oklahoma')

var fsm = Oklahoma({
  initial: 'alpha',
  states: {
    alpha: {
      targets: ['beta'],
      leave: [
        action1,
        action2
      ]
    },
    beta: {
      enter: [
        action3,
        action4
      ]
    }
  }
})

// Will change the state from 'alpha' to 'beta', running alpha's leave functions in order,
// then beta's enter functions in order.
// If any enter/leave function throws an error or rejects a promise, the state transition will abort.
fsm.go('beta')
```

## API

#### `Oklahoma(options) -> fsm`

##### options

###### options.initial

*Required*
Type: `string`

The id of the fsm's initial state.

###### options.states

*Required*
Type: `object`

An object where the keys are the ids of available states, and the values are an object describing each state:

- `targets: Array<string>` - An array of other states which can be transitioned to from this state.
- `enter: function|Array<function>` - Function(s) that will be called in order when `fsm.go` is called to enter this state.
- `leave: function|Array<function>` - Function(s) that will be called in order when `fsm.go` is called to leave this state.

Any enter or leave callback that returns a rejected promise will abort the current state transition.

#### `fsm.current() -> string`

Returns the id of the current state.

#### `fsm.go(state, [...args]) -> Promise`

Transition to the given state id. The id must be a valid target of the current state.

`args` will be passed into each enter/leave function.

Returns a promise that will be resolved or rejected when this state transition finishes.

If multiple state transitions are queued up at once, they will be run in order.

For example, `fsm.go('bar'); fsm.go('baz');` will attempt to transition to bar, then once that completes (success or failure), will attempt a transition to baz.

## License
MIT © [Andrew Joslin](http://ajoslin.com)
