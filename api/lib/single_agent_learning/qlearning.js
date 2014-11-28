/**
 * Q-learning for Single Agent Learning
 * @param alpha = learning rate
 * @param gamma = discount factor
 * @param actionSelectionPolicy = 'greedy' or 'soft'
 * @param epsilon = action selection variable
 * @constructor
 */
module.exports = function (options, callback) {

  if (!options) {
    options = {};
  }

  var numbers = require('numbers');

  console.log('start #' + options.id);

  options.results = [];

  // properties
  var world = new World();
  world.setSize(11);
  world.isLogEnabled = false;

  var worldSize = world.getSize();

  if (!options.gamma) {
    options.gamma = 0.8; // 0.1, 0.5, 0.7, 0.9
  }

  if (!options.alpha) {
    options.alpha = 0.5; // 0.1 ... 0.5
  }

  if (!options.epsilon) {
    options.epsilon = 0.1;
  }

  if (!options.nLearning) {
    options.nLearning = 100;
  }

  if (!options.actionSelector) {
    options.actionSelector = 'softmax';
  }

  if (!options.initQ) {
    options.initQ = 15;
  }

  var predatorActions = world.getPredatorActions();
  var preyActions = world.getPreyActions();

  // Algorithm
  // - init Q(s,a) = 15
  if (!options.stateSpace) {
    options.stateSpace = new OptimizedStateSpace(worldSize, 0);
    _.each(options.stateSpace, function (state) {

      state.actionValues = [];

      // if state is not terminal, set value to 15
      _.each(predatorActions, function (action) {
        if (state.id !== '0_0') {
          action.value = options.initQ;
        } else {
          action.value = 0;
        }
        state.actionValues.push(_.clone(action));
      });

    });
  }
  // -- init Q(s,a) end

  // for each episode - until n times
  var a, s, sPrime, r;
  for (var episode = 0; episode < options.nLearning; episode++) {

    var optimalAction = 0;
    // Init s
    s = encodeRelativeDistance({x: 0, y: 0}, {x: 5, y: 5}, worldSize);

    // repeat until terminal or innerReach
    var innerLoopStep = 0;
    do {
      // choose a from s using policy derived from Q (e.e e-greedy)
//      a = greedyActionSelections(options.epsilon, s, options.stateSpace);
      a = actionSelection(options.actionSelector, {
        epsilon: options.epsilon,
        currentStateIndex: s,
        stateSpace: options.stateSpace
      });

      // take action a, observe r and s'
      var sAfterPredatorAction = transitionFunction(s, 'predator', a, worldSize);

      // check optimal action
      if (isOptimalAction(s, sAfterPredatorAction)) {
        optimalAction++;
      }

      r = 0;
      if (sAfterPredatorAction === '0_0') {
        r = world.maxReward;
        sPrime = '0_0';

      } else {
        // prey take action to get s'
        var prey = new Agent(world, {
          actions: getPreyLegalMove(sAfterPredatorAction, preyActions, worldSize)
        });
        sPrime = transitionFunction(sAfterPredatorAction, 'prey', prey.takeRandomAction(), worldSize);
      }

      // update q(s,a)
      var actionValues = _.pluck(options.stateSpace[sPrime].actionValues, 'value');
      var qSPrimeA = numbers.basic.max(actionValues);

      if (!options.stateSpace[s].actionValues[a.index].exp) {
        options.stateSpace[s].actionValues[a.index].exp = 0;
      }

      options.stateSpace[s].actionValues[a.index].exp++;
      options.stateSpace[s].actionValues[a.index].value += options.alpha * (r + options.gamma * qSPrimeA - options.stateSpace[s].actionValues[a.index].value);

      // round precision
      options.stateSpace[s].actionValues[a.index].value = Math.round(options.stateSpace[s].actionValues[a.index].value * 1e6) / 1e6;

      // update s <- s'
      s = sPrime;

      innerLoopStep++;
    } while (s !== '0_0' && innerLoopStep < 10000);
    // we limit it to 10k to prevent the apps freeze

    if (!options.results) {
      options.results = [];
    }

    var _result = {
      step: innerLoopStep,
      optimalAction: optimalAction,
      optimalActionPercentage: (optimalAction / innerLoopStep * 100).toFixed(2) * 1.0
    };

    options.results.push(_result);
  }

  console.log('done #' + options.id);

  return callback(null, options.results);
};