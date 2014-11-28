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
    options.gamma = 0.9; //todo: try different values
  }

  if (!options.epsilon) {
    options.epsilon = 0.1;
  }

  if (!options.actionSelector) {
    options.actionSelector = 'softmax';
  }

  if (!options.nLearning) {
    options.nLearning = 100;
  }

  if (!options.initQ) {
    options.initQ = 15;
  }

  var predatorActions = world.getPredatorActions();
  var preyActions = world.getPreyActions();
  
  var output = [];

  var discountedReward = function (step, discountFactor, reward) {
    return reward * Math.pow(discountFactor, step);
  };

  var probability = function (actionSelector, opts) {

    var softmaxActionProbability = function (currentStateIndex, currentAction, stateSpace) {
      var actionValues = _.pluck(options.stateSpace[currentStateIndex].actionValues, 'value');

      var expValues = [];
      _.each(actionValues, function (actionValue) {
        expValues.push(Math.exp(actionValue));
      });

      return Math.exp(currentAction.value) / numbers.basic.sum(expValues);
    }

    var greedyActionProbability = function (epsilon, currentStateIndex, currentAction, stateSpace) {

      var action; // action Object
      // choose argmax q(s,a)
      var actionValues = _.pluck(stateSpace[currentStateIndex].actionValues, 'value');
      var maxValue = numbers.basic.max(actionValues);

      for (var i = 0; i < actionValues.length; i++) {
        if (actionValues[i] == maxValue) {
          action = stateSpace[currentStateIndex].actionValues[i];
          break;
        }
      }

      if (currentAction === action) {
        return 1 - epsilon + epsilon / _.size(predatorActions);
      } else {
        return epsilon / _.size(predatorActions);
      }
    };

    switch (actionSelector) {
      case 'greedy':
        return greedyActionProbability(opts.epsilon, opts.currentStateIndex, opts.currentAction, opts.stateSpace);

      case 'softmax':
        return softmaxActionProbability(opts.currentStateIndex, opts.currentAction, opts.stateSpace);
    }
  }
  
  // print current params
  console.log('Parameters: gamma:', options.gamma, 'epsilon:', options.epsilon, 'actionSelector:', options.actionSelector, 'nLearning:', options.nLearning);

  // Algorithm
  // - init Q(s,a) = 15
  if (!options.stateSpace) {
    options.stateSpace = new OptimizedStateSpace(worldSize, 0);
    _.each(options.stateSpace, function (state) {

      state.pi;
      state.actionValues = [];

      // if state is not terminal, set value to 15
      _.each(predatorActions, function (action) {
        if (state.id !== '0_0') {
          action.value = 0;
          action.QValue = 0;
        } else {
          action.value = 0;
          action.QValue = 0;
        }
        action.NValue = 0;
        action.DValue = 0;

        state.actionValues.push(_.clone(action));
      });
    });
  }

  // generate an episode
  var a, s, sPrime, r, stepsSum = 0;
  for (var episode = 1; episode <= options.nLearning; episode++) {
    var sARSequence = [];

    var optimalAction = 0;

    // Init s
    s = encodeRelativeDistance({x: 0, y: 0}, {x: 5, y: 5}, worldSize);

    // repeat until terminal or innerReach
    var innerLoopStep = 0;
    do {
      a = actionSelection(options.actionSelector, {
        epsilon: options.epsilon,
        currentStateIndex: s,
        stateSpace: options.stateSpace
      });

      // if the action is not optimal, save the step
      if (a !== options.stateSpace[s].pi) {
        tau = innerLoopStep;
      }

      // resolve action a, observe r and s'
      var sAfterPredatorAction = transitionFunction(s, 'predator', a, worldSize);

      // check optimal action
      if (isOptimalAction(s, sAfterPredatorAction)) {
        optimalAction++;
      }

      r = 0.1;
      if (sAfterPredatorAction === '0_0') {
        r = world.maxReward;
        sPrime = '0_0';

      } else {
        // prey take action to get s'
        var prey = new Agent(world, {
          actions: getPreyLegalMove(sAfterPredatorAction, preyActions, worldSize)
        });

        var preyAction = prey.takeRandomAction();
        sPrime = transitionFunction(sAfterPredatorAction, 'prey', preyAction, worldSize);
      }

      // record the state and the action
      sARSequence.push({state: s, action: a, reward: r});

      var text = 'undefined';
      if (options.stateSpace[s].pi) {
        text = options.stateSpace[s].pi.action;
      }
      // update s <- s'
      s = sPrime;
      innerLoopStep++;

    } while (s !== '0_0' && innerLoopStep < 10000);
    // we limit it to 10k to prevent the apps freeze

    output.push(innerLoopStep);
    stepsSum += innerLoopStep;

    var t, skip, curS, curA;
    w = 1;
    for (var i = sARSequence.length - 1; i >= tau; i--) {
      curS = sARSequence[i].state;
      curA = sARSequence[i].action;

      //calculate the weight of this state-action pair
      w = w / probability(options.actionSelector, {
        epsilon: options.epsilon,
        currentStateIndex: curS,
        currentAction: curA,
        stateSpace: options.stateSpace
      });

      // check if sARSequence[i] is the first
      skip = false;
      for (t = i - 1; t >= tau; t--) {
        if (sARSequence[t] === sARSequence[i]) {
          skip = true;
          break;
        }
      }

      // we wil update this state-action pair later, so skip it for now
      if (skip === true) {
        continue;
      }

      //update N(s,a), D(s,a) and Q(s,a)
      var steps = (sARSequence.length - 1) - i;
      curA.NValue += w * discountedReward(steps, options.gamma, _.last(sARSequence).reward);
      curA.DValue += w;

      //console.log('curS:', curS, '\tnew value:', curA.NValue / curA.DValue, 'r:', sARSequence[i].reward, 'w:', w, ', old vValue:', curA.value);

      curA.value = curA.NValue / curA.DValue;


      var actionValues = _.pluck(options.stateSpace[curS].actionValues, 'value');
      var maxIndex = argmax(actionValues);

      options.stateSpace[curS].pi = options.stateSpace[curS].actionValues[maxIndex]; //creates a redundant duplicate of an action

      options.stateSpace[curS].actionValues[curA.index] = curA;
    }
    // endfor each sARSequence

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