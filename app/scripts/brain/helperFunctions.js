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
  var _currentState = _.clone(currentState);

  if (typeof _currentState == 'string') {
    _currentState = {
      x: _currentState.split('_')[0] * 1.0,
      y: _currentState.split('_')[1] * 1.0
    };
  }

  if (actor === 'prey') {
    x = _currentState.x + action.transition.x;
    y = _currentState.y + action.transition.y;
  } else { // predator
    x = _currentState.x - action.transition.x;
    y = _currentState.y - action.transition.y;
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

var getPreyLegalMove = function (currentState, preyActions, worldSize) {
  var preyLegalActions = [];
  for (var j = 0; j < preyActions.length; j++) {

    //if this is legal then add to the list
    if (transitionFunction(currentState, 'prey', preyActions[j], worldSize) !== '0_0') {
      preyLegalActions.push(preyActions[j]);
    }

    // set probability of each action;
    if (preyLegalActions.length < 5) {
      // preyLegalActions[0].action must always be "stay"
      for (var k = 1; k < preyLegalActions.length; k++) {
        preyLegalActions[k].probability = (1 - preyLegalActions[0].probability) / (preyLegalActions.length - 1);
      }
    }
  }

  return preyLegalActions;
};

var rand = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

var actionSelection = function (actionSelector, opts) {
  var softmaxActionSelection = function (currentStateIndex, stateSpace) {

    var actionValues = _.pluck(stateSpace[currentStateIndex].actionValues, 'value');

    var expValues = [];
    _.each(actionValues, function (actionValue) {
      expValues.push(Math.exp(actionValue));
    });

    var randomValue = Math.random() * numbers.basic.sum(expValues);

    for (var i = 0; i < _.size(actionValues); i++) {
      if (randomValue <= expValues[i]) {
        return stateSpace[currentStateIndex].actionValues[i];
      } else {
        randomValue -= expValues[i];
      }
    }

    // to ensure it return something
    return _.first(stateSpace[currentStateIndex].actionValues);
  };

  var greedyActionSelections = function (epsilon, currentStateIndex, stateSpace) {
    var random = Math.random();

    var world = new World();
    world.setSize(11);
    world.isLogEnabled = false;
    var predatorActions = world.getPredatorActions();

    var action; // action Object
    if (random < epsilon) {
      // choose random action
      action = stateSpace[currentStateIndex].actionValues[rand(0, _.size(predatorActions) - 1)];
    } else {
      // choose argmax q(s,a)
      var actionValues = _.pluck(stateSpace[currentStateIndex].actionValues, 'value');
      var maxValue = numbers.basic.max(actionValues);

      for (var i = 0; i < actionValues.length; i++) {
        // if multiple actions have maxValue, use the first one
        if (actionValues[i] == maxValue) {
          action = stateSpace[currentStateIndex].actionValues[i];
          break;
        }
      }
    }

    return action;
  };

  switch (actionSelector) {
    case 'greedy':
      return greedyActionSelections(opts.epsilon, opts.currentStateIndex, opts.stateSpace);

    case 'softmax':
      return softmaxActionSelection(opts.currentStateIndex, opts.stateSpace);
  }
};

var drawChart = function (results, nbins, stateSpace, worldSize) {
  function averagingData(data, nPoints) {
    var batchSize = _.size(data) / nPoints;
    var _results = {
      labels: [],
      data: []
    };

    var i = 0, x = 0;
    while (i < _.size(data)) {

      var temp = [];
      for (var j = 0; j < batchSize && i < _.size(data); j++, i++) {
        temp.push(data[i]);
      }

      _results.labels.push(++x);
      _results.data.push(numbers.statistic.mean(temp));
    }

    return _results;
  }

  var results = averagingData(results, nbins);

  var data = {
    labels: results.labels,
    datasets: [
      {
        label: "results",
        fillColor: "rgba(220,220,220,0.2)",
        strokeColor: "rgba(220,220,220,1)",
        pointColor: "rgba(220,220,220,1)",
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: results.data
      }
    ]
  };

  var scenario = [];
  scenario.push({predator: {x: 0, y: 0}, prey: {x: 5, y: 5}});
  scenario.push({predator: {x: 2, y: 3}, prey: {x: 5, y: 4}});
  scenario.push({predator: {x: 2, y: 10}, prey: {x: 10, y: 0}});
  scenario.push({predator: {x: 10, y: 10}, prey: {x: 0, y: 0}});

  _.each(scenario, function (s) {
    console.log(stateSpace[encodeRelativeDistance(s.predator, s.prey, worldSize)]);
  });


  // updated chart
  var ctx = document.getElementById("chart").getContext("2d");
  var myLineChart = new Chart(ctx).Line(data, {pointDot: false, responsive: true, maintainAspectRatio: false});

};

var isOptimalAction = function (initState, endState) {
  var getDistance = function (state) {
    var x = state.split('_');
    return Math.abs(x[0] * 1.0) + Math.abs(x[1] * 1.0);
  };

  return getDistance(endState) < getDistance(initState);
};