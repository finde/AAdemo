/**
 * Q-learning for Single Agent Learning
 * @param alpha = learning rate
 * @param gamma = discount factor
 * @param actionSelectionPolicy = 'greedy' or 'soft'
 * @param epsilon = action selection variable
 * @constructor
 */
var QLearning = function (alpha, gamma, actionSelectionPolicy, epsilon, world, nLearning) {

  // properties
  if (!world) {
    world = new World();
    world.setSize(11);
    world.isLogEnabled = false;
  }

  var worldSize = world.getSize();
  var stateSpace = new OptimizedStateSpace(worldSize, 0);

  if (!gamma) {
    gamma = 0.1; // 0.1, 0.5, 0.7, 0.9
  }

  if (!alpha) {
    alpha = 0.1; // 0.1 ... 0.5
  }

  if (!epsilon) {
    epsilon = 0.1;
  }

  if (!nLearning) {
    nLearning = 2;
  }

  var predatorActions = world.getPredatorActions();
  var preyActions = world.getPreyActions();

  // method's
  var rand = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  var predatorArgmax = function (currentState, stateSpace) {

    // for each predator action
    var actionValue = [];
    _.each(predatorActions, function (predatorAction) {

      var partialSum = 0;

      // predator take action
      var predatorEndState = transitionFunction(currentState, 'predator', predatorAction, worldSize);

      // immediate reward for predator will catch the prey based on this action
      if (predatorEndState === '0_0') {

        partialSum += world.maxReward;

      } else {

        var preyLegalActions = getPreyLegalMove(currentState, preyActions, worldSize);
        _.each(preyLegalActions, function (preyAction) {

          // prey take action
          var preyEndState = transitionFunction(predatorEndState, 'prey', preyAction, worldSize);

          // only use the prey action probability because the predator action is deterministic
          partialSum += stateSpace[preyEndState].value * preyAction.probability;

        });
      }

      actionValue.push(partialSum);
    });

    // return action
    return predatorActions[argmax(actionValue)];
  };

  var greedyActionSelections = function (epsilon, currentStateIndex, stateSpace) {
    var random = Math.random();

    var action; // action Object
    if (random < epsilon) {
      // choose random action
      action = predatorActions[rand(0, _.size(predatorActions))];
    } else {
      // choose argmax q(s,a)
      var actionIndex = argmax(_.pluck(stateSpace[currentStateIndex].actionValues, 'value'));
      action = stateSpace[currentStateIndex].actionValues[actionIndex];
    }

    return action;
  };

  // Algorithm
  // - init Q(s,a) = 15
  _.each(stateSpace, function (state) {

    state.actionValues = [];

    // if state is not terminal, set value to 15
    _.each(predatorActions, function (action) {
      if (state.id !== '0_0') {
        action.value = 15;
      } else {
        action.value = 0;
      }
      state.actionValues.push(_.clone(action));
    });

  });

  // for each episode - until n times
  var s;
  for (var episode = 0; episode < nLearning; episode++) {

    // Init s
    s = encodeRelativeDistance({x: 0, y: 0}, {x: 5, y: 5}, worldSize);

    // repeat until terminal or innerReach
    var innerLoopStep = 0;
    do {
      // choose a from s using policy derived from Q (e.e e-greedy)
      var a = greedyActionSelections(epsilon, s, stateSpace);

      // take action a, observe r and s'
      var sAfterPredatorAction = transitionFunction(s, 'predator', a, worldSize);
      var r = 0;
      if (sAfterPredatorAction.id === '0_0') {
        r = world.maxReward;
      } else {
        // prey take action to get s'
        transitionFunction(s, 'prey', preyAction, worldSize);
      }

      // update q(s,a)

      // update s <- s'

    } while (s.id !== '0_0' && innerLoopStep++ < 10000);

  }


  return stateSpace;
};