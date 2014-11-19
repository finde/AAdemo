var OffPolicyMC = function (options) {
  if (!options) {
    options = {};
  }
    if (!options.actionSelector) {
    options.actionSelector = 'softmax';
  }

  if (!options.nLearning) {
    options.nLearning = 100;
  }

  // properties
  var world = new World();
  world.setSize(11);
  world.isLogEnabled = false;

  var worldSize = world.getSize();

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
          action.value = 15;
        } else {
          action.value = 0;
        }
        action.NValue = 0;
        action.DValue = 0;
        state.actionValues.push(_.clone(action));
      });
    });
  }
  
  // generate an episode
  var a, s, sPrime, r;
  var stateActionSequence = [];
  for (var episode = 0; episode < options.nLearning; episode++) {

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
      
      // calculate argmax q(s,a)
      var actionValues = _.pluck(stateSpace[currentStateIndex].actionValues, 'value');
      var maxValue = numbers.basic.max(actionValues);

      for (var i = 0; i < actionValues.length; i++) {
        if (actionValues[i] == maxValue) {
          optimalAction = stateSpace[currentStateIndex].actionValues[i];
          break;
        }
      }      
      
      // if the action is not optimal, save the step
      if (a !==optimalAction) {
        lastTimeDifferent = innerLoopStep;
      }
      
      // record the state and the action
      stateActionSequence.push({s, a});
      
      // resolve action a, observe r and s'
      var sAfterPredatorAction = transitionFunction(s, 'predator', a, worldSize);
      r = 0;
      if (sAfterPredatorAction === '0_0') {
        r = world.maxReward;
        sPrime = '0_0';

      } else {
        // prey take action to get s'
        var prey = new Agent(world, {
          actions: getPreyLegalMove(s, preyActions, worldSize)
        });

        sPrime = transitionFunction(s, 'prey', prey.takeRandomAction(), worldSize);
      }
      
      // update s <- s'
      s = sPrime;
      console.log('state:', s);
    } while (sPrime !== '0_0' && innerLoopStep++ < 100);
    stateSequence.push(s); 
  }
  return;
}
