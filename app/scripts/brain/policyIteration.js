var PolicyIteration = function (gamma, theta, world) {

  // initiation
  var worldSize = world.getSize();
  var stateSpace = new OptimizedStateSpace(worldSize, 0);

  // discount factor
  if (!gamma) {
    gamma = 0.1;
  }

  if (!theta) {
    theta = 0.001;
  }

  console.log('policyIteration== gamma:', gamma, 'theta:', theta);

  var predatorActions = world.getPredatorActions();
  var preyActions = world.getPreyActions();

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

    ////// policy improvement
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
    console.log('Iteration:' + iteration, 'isPolicyStable:', isPolicyStable);
  } while (!isPolicyStable);

  return {stateSpace: stateSpace, policy: policy, iteration: iteration};
};