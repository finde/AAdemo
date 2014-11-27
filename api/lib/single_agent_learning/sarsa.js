/**
 * Sarsa for Single Agent Learning
 * @param alpha = learning rate
 * @param gamma = discount factor
 * @param actionSelectionPolicy = 'greedy' or 'soft'
 * @param epsilon = action selection variable
 * @constructor
 */
var Sarsa = function (options, callback) {

  console.log(options);

  if (!options) {
    options = {};
  }

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

  // for each episode - until n times
  var a, aPrime, s, sPrime, r;
  for (var episode = 0; episode < options.nLearning; episode++) {

    var optimalAction = 0;

    // Init s
    s = encodeRelativeDistance({x: 0, y: 0}, {x: 5, y: 5}, worldSize);

    // choose a from s using policy derived from Q (e.g e-greedy)
    a = actionSelection(options.actionSelector, {
      epsilon: options.epsilon,
      currentStateIndex: s,
      stateSpace: options.stateSpace
    });

    // repeat until terminal or innerReach
    var innerLoopStep = 0;
    do {

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

      // choose a' from s' using policy derived from Q (e.g e-greedy)
      aPrime = actionSelection(options.actionSelector, {
        epsilon: options.epsilon,
        currentStateIndex: sPrime,
        stateSpace: options.stateSpace
      });

      // update q(s,a)
      var qSPrimeAPrime = options.stateSpace[sPrime].actionValues[aPrime.index].value;

      options.stateSpace[s].actionValues[a.index].value += options.alpha * (r + options.gamma * qSPrimeAPrime - options.stateSpace[s].actionValues[a.index].value);

      // round precision
      options.stateSpace[s].actionValues[a.index].value = Math.round(options.stateSpace[s].actionValues[a.index].value * 1e6) / 1e6;

      // update s <- s'
      s = sPrime;
      a = aPrime;

      innerLoopStep++;
    } while (s !== '0_0');

    var _result = {
      step: innerLoopStep,
      optimalAction: optimalAction,
      optimalActionPercentage: (optimalAction / innerLoopStep * 100).toFixed(2) * 1.0
    };

    options.results.push(_result);

//    console.log('episode:', episode, innerLoopStep, optimalAction, _result.optimalActionPercentage + '%');
  }

//  console.log('best:', numbers.basic.min(_.pluck(options.results, 'step')));
  console.log('Done, #' + id);

  return callback(null, options.results);
};