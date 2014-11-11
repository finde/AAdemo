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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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
  // target - start location
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

////////////////////////////////////////////////////////////////////////////////////////////////////

var valueIteration = function (gamma, theta) {

  var world = new World();
  world.setSize(11);

  var worldSize = world.getSize();
  var stateSpace = new OptimizedStateSpace(11, 0);

  if (!gamma) {
    gamma = 0.1;
  }

  if (!theta) {
    theta = 0.001;
  }

  console.log('valueIteration== gamma:', gamma, 'theta:', theta);

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
    _.forEach(stateSpace, function (state) {
      var temp = _.clone(state);

      // if the current state is terminal state, then ignored
      if (state.id !== '0_0') {

        var actionValues = [];
        var feedbackPredator, feedbackPrey;

        // for each actions
        // -- predator action
        for (var r = 0; r < predatorActions.length; r++) {

          // reset partialSum
          var partialSum = 0;

          // find final destination s->s'
          var predatorAction = predatorActions[r];
          feedbackPredator = transitionFunction(temp.coord, 'predator', predatorAction, worldSize);

          // if predator and prey are side by side and predator will catch the prey, which resulting maxReward
          if (feedbackPredator === '0_0') {
            actionValues.push(world.maxReward);
            continue;
          }

          var feedbackPredatorCoord = {
            x: feedbackPredator.split('_')[0] * 1.0,
            y: feedbackPredator.split('_')[1] * 1.0
          };

          // find legal actions for prey
          // -- prey action
          var preyLegalActions = [];
          for (var j = 0; j < preyActions.length; j++) {

            //if this is legal then add to the list
            if (transitionFunction(feedbackPredatorCoord, 'prey', preyActions[j], worldSize) !== '0_0') {
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

          // for predator action which cannot catch the prey, and not terminal
          for (var y = 0; y < preyLegalActions.length; y++) {
            var preyAction = preyLegalActions[y];
            feedbackPrey = transitionFunction(feedbackPredatorCoord, 'prey', preyAction, worldSize);

            var immediate_reward = 0; // remember to change
            if (feedbackPrey === '0_0') {
              immediate_reward = world.maxReward;
            }

            // if allowed
            var vDestination = _.findWhere(stateSpace, {id: feedbackPrey});

            partialSum += preyAction.probability * (immediate_reward + gamma * vDestination.value);
          } // foreach prey action

          actionValues.push(partialSum);
        } // foreach predator action

        var currentState = _.find(stateSpace, {id: temp.id});

        currentState.actionValues = actionValues;
        currentState.value = numbers.basic.max(actionValues);

        delta = numbers.basic.max([delta, Math.abs(temp.value - currentState.value)]);
      }

    });

    iteration++;
    console.log('delta >>>', iteration, delta);
  } while (delta >= theta);


  // after converge, calculate policy for each state
  var policy = {};

  _.each(stateSpace, function (state) {

    if (state.id !== '0_0') {
      // argmax a from value iteration
      var maxValue = numbers.basic.max(state.actionValues);
      var actionIndex = _.indexOf(state.actionValues, maxValue);

      policy[state.id] = predatorActions[actionIndex];
    }
  });

  return {stateSpace: stateSpace, policy: policy};
};

////////////////////////////////////////////////////////////////////////////////////////////////////

var policyEvaluation = function (gamma, theta) {

  var world = new World();
  world.setSize(11);

  var worldSize = world.getSize();
  var stateSpace = new OptimizedStateSpace(11, 0);

  if (!gamma) {
    gamma = 0.1;
  }

  if (!theta) {
    theta = 0.001;
  }

  console.log('policyEvaluation== gamma:', gamma, 'theta:', theta);

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

  var iteration = 0;
  do {
    var delta = 0;

    // for each state
    _.forEach(stateSpace, function (state) {
      var temp = _.clone(state);

      // if the current state is terminal state, then ignored
      if (state.id !== '0_0') {

        var partialActionValues = 0;
        var feedbackPredator, feedbackPrey;

        // for each actions
        // -- predator action
        for (var r = 0; r < predatorActions.length; r++) {

          // reset partialSum
          var partialSum = 0;

          // find final destination s->s'
          var predatorAction = predatorActions[r];
          feedbackPredator = transitionFunction(temp.coord, 'predator', predatorAction, worldSize);

          // if predator and prey are side by side and predator will catch the prey, which resulting maxReward
          if (feedbackPredator === '0_0') {
            partialActionValues += world.maxReward;
            continue;
          }

          var feedbackPredatorCoord = {
            x: feedbackPredator.split('_')[0] * 1.0,
            y: feedbackPredator.split('_')[1] * 1.0
          };

          // find legal actions for prey
          // -- prey action
          var preyLegalActions = [];
          for (var j = 0; j < preyActions.length; j++) {

            //if this is legal then add to the list
            if (transitionFunction(feedbackPredatorCoord, 'prey', preyActions[j], worldSize) !== '0_0') {
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

          // for predator action which cannot catch the prey, and not terminal
          for (var y = 0; y < preyLegalActions.length; y++) {
            var preyAction = preyLegalActions[y];
            feedbackPrey = transitionFunction(feedbackPredatorCoord, 'prey', preyAction, worldSize);

            var immediate_reward = 0; // remember to change
            if (feedbackPrey === '0_0') {
              immediate_reward = world.maxReward;
            }

            // if allowed
            var vDestination = _.findWhere(stateSpace, {id: feedbackPrey});

            partialSum += preyAction.probability * (immediate_reward + gamma * vDestination.value);
          } // foreach prey action

          partialActionValues += predatorActions[r].probability * partialSum;

        } // foreach predator action

        var currentState = _.find(stateSpace, {id: temp.id});

        currentState.value = partialActionValues;

        delta = numbers.basic.max([delta, Math.abs(temp.value - currentState.value)]);
      }

    });

    iteration++;
    console.log('delta >>>', iteration, delta);
  } while (delta >= theta);


  // after converge, calculate policy for each state
  var policy = {};

  // print
  var scenario = [];
  scenario.push({predator: {x: 0, y: 0}, prey: {x: 5, y: 5}});
  scenario.push({predator: {x: 2, y: 3}, prey: {x: 5, y: 4}});
  scenario.push({predator: {x: 2, y: 10}, prey: {x: 10, y: 0}});
  scenario.push({predator: {x: 10, y: 10}, prey: {x: 0, y: 0}});

  for (var i = 0; i < scenario.length; i++) {
    console.log('=============================================')
    console.log(' Predator:', scenario[i].predator.x, ',', scenario[i].predator.y);
    console.log(' Prey:', scenario[i].prey.x, ',', scenario[i].prey.y);
    console.log(' Value:', _.find(stateSpace, {id: encodeRelativeDistance(scenario[i].predator, scenario[i].prey, worldSize) }));
  }

  return {stateSpace: stateSpace, policy: policy};
};

////////////////////////////////////////////////////////////////////////////////////////////////////

var policyIteration = function (gamma, theta) {
  // initiation
  var world = new World();
  world.setSize(11);

  var worldSize = world.getSize();
  var stateSpace = new OptimizedStateSpace(11, 0);

  if (!gamma) {
    gamma = 0.1;
  }

  if (!theta) {
    theta = 0.001;
  }

  console.log('valueIteration== gamma:', gamma, 'theta:', theta);

  var predatorActions = [
    { action: 'stay', transition: { x: 0, y: 0 }, probability: 0.2 },
    { action: 'left', transition: { x: -1, y: 0 }, probability: 0.2 },
    { action: 'right', transition: { x: 1, y: 0 }, probability: 0.2 },
    { action: 'up', transition: { x: 0, y: -1 }, probability: 0.2 },
    { action: 'down', transition: { x: 0, y: 1 }, probability: 0.2 }
  ];

  var preyActions = [
    { action: 'stay', transition: { x: 0, y: 0 }, probability: 0.8 },
    { action: 'left', transition: { x: -1, y: 0 }, probability: 0.05 },
    { action: 'right', transition: { x: 1, y: 0 }, probability: 0.05 },
    { action: 'up', transition: { x: 0, y: -1 }, probability: 0.05 },
    { action: 'down', transition: { x: 0, y: 1 }, probability: 0.05 }
  ];

  // policy
  var policy = {};

  _.each(stateSpace, function (state) {
    policy[state.id] = predatorActions[1]; // wait
  });

  var iteration = 0;

  do {

    ////// policy evaluation
    do {
      var delta = 0;

      // for each state
      _.forEach(stateSpace, function (state) {
        var temp = _.clone(state);
        var currentState = _.find(stateSpace, {id: temp.id});

        // if the current state is terminal state, then ignored
        if (state.id !== '0_0') {

          var partialActionValues = 0;
          var feedbackPredator, feedbackPrey;

          // for each actions
          // -- predator action
          var predatorAction = policy[state.id];

          // reset partialSum
          var partialSum = 0;

          // find final destination s->s'
          feedbackPredator = transitionFunction(temp.coord, 'predator', predatorAction, worldSize);

          // if predator and prey are side by side and predator will catch the prey, which resulting maxReward
          if (feedbackPredator === '0_0') {

            currentState.value = world.maxReward;

          } else {

            var feedbackPredatorCoord = {
              x: feedbackPredator.split('_')[0] * 1.0,
              y: feedbackPredator.split('_')[1] * 1.0
            };

            // find legal actions for prey
            // -- prey action
            var preyLegalActions = [];
            for (var j = 0; j < preyActions.length; j++) {

              //if this is legal then add to the list
              if (transitionFunction(feedbackPredatorCoord, 'prey', preyActions[j], worldSize) !== '0_0') {
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

            // for predator action which cannot catch the prey, and not terminal
            for (var y = 0; y < preyLegalActions.length; y++) {
              var preyAction = preyLegalActions[y];
              feedbackPrey = transitionFunction(feedbackPredatorCoord, 'prey', preyAction, worldSize);

              var immediate_reward = 0; // remember to change
              if (feedbackPrey === '0_0') {
                immediate_reward = world.maxReward;
              }

              // if allowed
              var vDestination = _.findWhere(stateSpace, {id: feedbackPrey});

              partialSum += preyAction.probability * (immediate_reward + gamma * vDestination.value);
            } // foreach prey action

            partialActionValues += predatorAction.probability * partialSum;

            currentState.value = partialActionValues;

          }

          delta = numbers.basic.max([delta, Math.abs(temp.value - currentState.value)]);
        }
      });

      console.log(delta);
    } while (delta >= theta);

    /// policy improvement
    var isPolicyStable = true;
    _.each(stateSpace, function (state) {
      var oldAction = _.clone(policy[state.id]);

      //////// calculating policy
      // for each state
      var temp = _.clone(state);

      // if the current state is terminal state, then ignored
      if (state.id !== '0_0') {

        var actionValues = [];
        var feedbackPredator, feedbackPrey;

        // for each actions
        // -- predator action
        for (var r = 0; r < predatorActions.length; r++) {

          // reset partialSum
          var partialSum = 0;

          // find final destination s->s'
          var predatorAction = predatorActions[r];
          feedbackPredator = transitionFunction(temp.coord, 'predator', predatorAction, worldSize);

          // if predator and prey are side by side and predator will catch the prey, which resulting maxReward
          if (feedbackPredator === '0_0') {
            actionValues.push(world.maxReward);
            continue;
          }

          var feedbackPredatorCoord = {
            x: feedbackPredator.split('_')[0] * 1.0,
            y: feedbackPredator.split('_')[1] * 1.0
          };

          // find legal actions for prey
          // -- prey action
          var preyLegalActions = [];
          for (var j = 0; j < preyActions.length; j++) {

            //if this is legal then add to the list
            if (transitionFunction(feedbackPredatorCoord, 'prey', preyActions[j], worldSize) !== '0_0') {
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

          // for predator action which cannot catch the prey, and not terminal
          for (var y = 0; y < preyLegalActions.length; y++) {
            var preyAction = preyLegalActions[y];
            feedbackPrey = transitionFunction(feedbackPredatorCoord, 'prey', preyAction, worldSize);

            var immediate_reward = 0; // remember to change
            if (feedbackPrey === '0_0') {
              immediate_reward = world.maxReward;
            }

            // if allowed
            var vDestination = _.findWhere(stateSpace, {id: feedbackPrey});

            partialSum += preyAction.probability * (immediate_reward + gamma * vDestination.value);
          } // foreach prey action

          actionValues.push(partialSum);

        } // foreach predator action

        var maxValues = numbers.basic.max(actionValues);
        var actionIndex = _.indexOf(actionValues, maxValues);
        policy[state.id] = predatorActions[actionIndex];
      }


      if (oldAction.action !== policy[state.id].action) {
        isPolicyStable = false;
      }
    });

    iteration++;
  } while (!isPolicyStable);

  return {stateSpace: stateSpace, policy: policy};
};