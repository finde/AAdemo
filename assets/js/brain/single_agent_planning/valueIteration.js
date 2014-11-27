var ValueIteration = function (gamma, theta, world, precision) {

  // initiation
  var worldSize = world.getSize();
  var stateSpace = new OptimizedStateSpace(worldSize, 0);

  if (!gamma) {
    gamma = 0.1;
  }

  if (!theta) {
    theta = 0.001;
  }

  if (!precision) {
    precision = 1e7;
  }

  console.log('valueIteration== gamma:', gamma, 'theta:', theta);

  var predatorActions = world.getPredatorActions();
  var preyActions = world.getPreyActions();

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

          // round to 7 digits precision
          partialSum = Math.round(partialSum * precision);
          actionValues.push(partialSum / precision);

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

      // allow policy with sameValue
      // argmax a from value iteration
      var maxValue = numbers.basic.max(state.actionValues);

      policy[state.id] = [];
      _.each(state.actionValues, function (values, actionIndex) {
        if (values == maxValue) {
          policy[state.id].push(_.clone(predatorActions[actionIndex]))
        }
      });
    }

  });

  return {stateSpace: stateSpace, policy: policy, iteration: iteration};
};