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

var generateID = function (predator, prey) {
  return [predator.x, predator.y, prey.x, prey.y].join('_');
};

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

var valueIteration = function () {

  var world = new World();
  world.setSize(11);

  var stateSpace = new StateSpace(11, 0);

  var theta = 0.5;
  var gamma = 0.1;

  // for each state in stateSpace
  var predatorActions = [
    { action: 'stay', transition: { x: 0, y: 0 }, probability: 0.2 },
    { action: 'left', transition: { x: -1, y: 0 }, probability: 0.2 },
    { action: 'right', transition: { x: 1, y: 0 }, probability: 0.2 },
    { action: 'up', transition: { x: 0, y: -1 }, probability: 0.2 },
    { action: 'down', transition: { x: 0, y: 1 }, probability: 0.2 }
  ];

  // for each state in stateSpace
  var preyActions = [
    { action: 'stay', transition: { x: 0, y: 0 }, probability: 0.8 },
    { action: 'left', transition: { x: -1, y: 0 }, probability: 0.05 },
    { action: 'right', transition: { x: 1, y: 0 }, probability: 0.05 },
    { action: 'up', transition: { x: 0, y: -1 }, probability: 0.05 },
    { action: 'down', transition: { x: 0, y: 1 }, probability: 0.05 }
  ];

  var finalState = function () {
    //returns the index of the resulting state after actions

    return 0;
  };

  var iteration = 0;
  do {
    var delta = 0;

    // for each state
    for (var i = 0; i < stateSpace.length; i++) {

      var temp = _.clone(stateSpace[i]);

      // if the current state is terminal state, then ignored
      if (world.isSamePosition(temp.predator, temp.prey)) {
//        actionValues.push(0);
        continue;
      }

      var actionValues = [];
      var feedbackPredator, feedbackPrey;

      // for each actions
      for (var r = 0; r < predatorActions.length; r++) {

        // find final destination s->s'
        var predatorAction = predatorActions[r];
        feedbackPredator = world.giveFeedback(temp.predator, predatorAction);

        // if predator and prey are side by side and predator will catch the prey, which resulting maxReward
        if (world.isSamePosition(feedbackPredator.state, temp.prey)) {
          actionValues.push(world.maxReward);
          continue;
        }

        // if after predator move, the predator is adj. to the prey, change the probability
        var preyLegalActions = [];
        for (var j = 0; j < preyActions.length; j++) {

          //if this is legal then add to the list
          feedbackPrey = world.giveFeedback(temp.prey, preyActions[j]);
          if (!world.isSamePosition(feedbackPrey.state, feedbackPredator.state)) {
            preyLegalActions.push(preyActions[j]);
          }

        }
        // set probability of each action;
        if (preyLegalActions.length < 5) {

          // preyLegalActions[0].action must always be "stay"
          for (var j = 1; j < preyLegalActions.length; j++) {
            preyLegalActions[j].probability = (1 - preyLegalActions[0].probability) / (preyLegalActions.length - 1);
          }
        }

        // for predator action which cannot catch the prey, and not terminal
        for (var y = 0; y < preyLegalActions.length; y++) {
          var preyAction = preyLegalActions[y];
          feedbackPrey = world.giveFeedback(temp.prey, preyAction);

          //if prey suicide
          // final position for predator and prey are the same, but prey moved
          if (world.isSamePosition(feedbackPredator.state, feedbackPrey.state) && !world.isSamePosition(temp.prey, feedbackPrey.state)) {
            continue;
          }

          var immediate_reward = 0; // remember to change
          if (world.isSamePosition(feedbackPredator.state, feedbackPrey.state)) {
            immediate_reward = world.maxReward;
          }

          // if allowed
          if (feedbackPredator && feedbackPrey) {
            var destinationIndex = generateID(feedbackPredator.state, feedbackPrey.state);

            var vDestination = _.findWhere(stateSpace, {id: destinationIndex});

            actionValues.push(preyAction.probability * (immediate_reward + gamma * vDestination.value));
          }

        }
      }

      stateSpace[i].value = numbers.basic.max(actionValues);
      delta = numbers.basic.max([delta, Math.abs(temp.value - stateSpace[i].value)]);

      console.log(i);
    }

    iteration++;
    console.log('delta >>>',iteration, delta)
  } while (delta >= theta);

  console.log(iteration);
  return stateSpace;
};