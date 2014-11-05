'use strict';

var Simulator = function (nTimes, opt, callbackFn) {

  // prepare result
  var simulations = [];
  for (var i = 0; i < nTimes; i++) {

    //simulation function
    simulations.push(function (callback) {
      var self = {};

      self.world = new World();
      self.world.setSize(opt.worldSize);
      self.world.isLogEnabled = false;
      self.world.spawnPredator(opt.predatorInitState);
      self.world.spawnPrey(opt.preyInitState);

      return callback(null, self.world.solveSimulation());
    });
  }

  var stats = {};

  // run on async
  async.parallel(simulations, function (error, results) {

    stats = {
      standardDev: numbers.statistic.standardDev(results),
      mean: numbers.statistic.mean(results),
      data: results
    };

    if (!!callbackFn) {
      return callbackFn(stats);
    }
  });

  return stats;
};

var StateSpace = function (value) {
  var world = new World();
  world.setSize(11);

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

  var generateID = function (predator, prey) {
    return [predator.x, predator.y, prey.x, prey.y].join('_');
  };

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

var valueIteration = function () {

  var stateSpace = new StateSpace(0);

  var delta = 0;
  var theta = 0;

  // for each state in stateSpace
  var actions = [
    { action: 'stay', transition: { x: 0, y: 0 }, probability: 0.2 },
    { action: 'left', transition: { x: -1, y: 0 }, probability: 0.2 },
    { action: 'right', transition: { x: 1, y: 0 }, probability: 0.2 },
    { action: 'up', transition: { x: 0, y: -1 }, probability: 0.2 },
    { action: 'down', transition: { x: 0, y: 1 }, probability: 0.2 }
  ];

  do {

    for (var i = 0; i < stateSpace.length; i++) {
      var temp = stateSpace[i];

      // for each actions
      var actionValues = [];
      for (var a =0; a<actions.length; a++){
        
      }

      stateSpace[i] = numbers.basic.max(actionValues);
    }

  } while (delta < theta);


};