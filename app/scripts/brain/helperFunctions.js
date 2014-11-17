var StateSpace = function (size, value) {
  var world = new World();
  world.setSize(size);

  var worldSize = world.getSize();

  var _predatorStates = [];
  var _preyStates = [];
  var _stateSpace = [];

  // define individual stateSpace
  for (var x = 0; x < worldSize; x++) {
    for (var y = 0; y < worldSize; y++) {
      _predatorStates.push({x: x, y: y});
      _preyStates.push({x: x, y: y});
    }
  }

  // combination state
  for (var x = 0; x < _predatorStates.length; x++) {
    for (var y = 0; y < _preyStates.length; y++) {

      _stateSpace.push({
        id: generateID(_predatorStates[x], _preyStates[y]),
        predator: _predatorStates[x],
        prey: _preyStates[y],
        value: value
      });

    }
  }

  return _stateSpace;
};

/**
 * toroidalConvertion
 * @param i
 * @param middle
 * @returns {*}
 */
var toroidalConvertion = function (i, middle, worldSize) {
  if (i > middle) {
    i -= worldSize;
  }

  if (i < -1 * middle) {
    i += worldSize;
  }

  return i;
};

/***
 * relative distance encoder
 * @param predatorCoord
 * @param preyCoord
 * @returns {string}
 */
var encodeRelativeDistance = function (predatorCoord, preyCoord, worldSize) {

  // start - target location
  var x = predatorCoord.x - preyCoord.x;
  var y = predatorCoord.y - preyCoord.y;

  return [ toroidalConvertion(x, worldSize / 2, worldSize), toroidalConvertion(y, worldSize / 2, worldSize)].join('_');
};

/***
 * Optimized State Space, with assumption environment / world is toroidal without boundaries / blocks
 * @param size
 * @param value
 * @constructor
 */
var OptimizedStateSpace = function (size, value) {
  var world = new World();
  world.setSize(size);

  var worldSize = world.getSize();

  var _predatorStates = [];
  var _preyStates = [];
  var _stateSpace = {};

  // define individual stateSpace
  for (var x = 0; x < worldSize; x++) {
    for (var y = 0; y < worldSize; y++) {
      _predatorStates.push({x: x, y: y});
      _preyStates.push({x: x, y: y});
    }
  }

  // combination state
  for (var i = 0; i < _predatorStates.length; i++) {
    for (var j = 0; j < _preyStates.length; j++) {

      // encode relative distance
      var id = encodeRelativeDistance(_predatorStates[i], _preyStates[j], worldSize);

      // we do not need to check if it exist, but instead always overwrite, because it is the same
      _stateSpace[id] = {
        id: id,
        coord: {
          x: id.split('_')[0] * 1.0,
          y: id.split('_')[1] * 1.0
        },
        value: value
      };

    }
  }

  return _stateSpace;
};

/***
 * transition function based on relative distance
 * @param currentState
 * @param actor : 'prey' or 'predator'
 * @param action
 * @param worldSize
 */
var transitionFunction = function (currentState, actor, action, worldSize) {

  var x, y;

  if (actor === 'prey') {
    x = currentState.x + action.transition.x;
    y = currentState.y + action.transition.y;
  } else { // predator
    x = currentState.x - action.transition.x;
    y = currentState.y - action.transition.y;
  }

  return [ toroidalConvertion(x, worldSize / 2, worldSize), toroidalConvertion(y, worldSize / 2, worldSize)].join('_');
};

var isSameLocation = function (state1, state2) {
  return state1.x == state2.x && state1.y == state2.y;
};

// Internal function: creates a callback bound to its context if supplied
// Copied from underscore.js:
// https://github.com/jashkenas/underscore/blob/master/underscore.js
var createCallback = function (func, context, argCount) {
  if (!context) {
    return func;
  }
  switch (argCount == null ? 3 : argCount) {
    case 1:
      return function (value) {
        return func.call(context, value);
      };
    case 2:
      return function (value, other) {
        return func.call(context, value, other);
      };
    case 3:
      return function (value, index, collection) {
        return func.call(context, value, index, collection);
      };
    case 4:
      return function (accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
  }
  return function () {
    return func.apply(this, arguments);
  };
};

// An internal function to generate lookup iterators.
// Copied from underscore.js:
// https://github.com/jashkenas/underscore/blob/master/underscore.js
var lookupIterator = function (value, context, argCount) {
  if (value == null) {
    return _.identity;
  }
  if (_.isFunction(value)) {
    return createCallback(value, context, argCount);
  }
  if (_.isObject(value)) {
    return _.matches(value);
  }
  return _.property(value);
};


// return the index of the smallest element in the array "obj".
// If "iterator" is given, it is called on each element and the result is used for comparison.
var argmin = function (obj, iterator, context) {
  var min = null, argmin = null, value;
  if (iterator) {
    iterator = lookupIterator(iterator, context);
  }
  for (var i = 0, length = obj.length; i < length; i++) {
    value = iterator ? iterator(obj[i]) : obj[i];
    if (min == null || value < min) {
      min = value;
      argmin = i;
    }
  }
  return argmin;
};


// return the index of the largest element in the array "obj".
// If "iterator" is given, it is called on each element and the result is used for comparison.
var argmax = function (obj, iterator, context) {
  var max = null, argmax = null, value;
  if (iterator) {
    iterator = lookupIterator(iterator, context);
  }
  for (var i = 0, length = obj.length; i < length; i++) {
    value = iterator ? iterator(obj[i]) : obj[i];
    if (max == null || value > max) {
      max = value;
      argmax = i;
    }
  }
  return argmax;
};