var onPolicyMC = function(gamma, epsilon, n) {

  // get world size, state space, and actions
  var world = new World();
  world.setSize(11);
  world.isLogEnabled = false;

  var worldSize = world.getSize();
  var stateSpace = new OptimizedStateSpace(worldSize, 0);

  var predatorActions = world.getPredatorActions();
  var preyActions = world.getPreyActions();


  // =====================
  // Helper Function
  // =====================

  // epsilon-greedy policy, one of epsilon-soft policy
  var epsilonGreedyPolicy = function(epsilon, currentState, policy) {
    var random = Math.random();
    var action;

    if (random <= (1 - epsilon + (epsilon / predatorActions.length))) {
      // greedy action
      action = policy[currentState.id].greedy;
    } else {
      // choose random action
      var idAction = Math.floor(Math.random() * policy[currentState.id].random.length);
      action = policy[currentState.id].random[idAction];
    }

    return action;
  };

  // init policy
  var initPolicy = function() {
    var policy = {};

    _.forEach(stateSpace, function (state) {
      var idGreedy = Math.floor(Math.random() * predatorActions.length);
      var greedy = predatorActions[idGreedy];
      var random = [];

      for (var j = 0; j < predatorActions.length; j++) {
        if (j !== idGreedy) {
          random.push(predatorActions[j]);
        }
      }

      policy[state.id] = {greedy: greedy, random: random}; 
    })

    return policy;
  }

  // Initialization function
  var initialization = function(epsilon) {
    var Q = {}
    var Returns = {};
    var policy = {};
    var qValue;

    // initialize Q(s,a) and Returns for all states and actions
    _.forEach(stateSpace, function (state) {
      if (state.id == '0_0')
        qValue = 0;
      else
        qValue = 1;

      for(var i = 0; i < predatorActions.length; i++) {
        var id = state.id + '_' + predatorActions[i].action;

        Q[id] = {
          id: state.id + '_' + predatorActions[i].action,
          state: state,
          action: predatorActions[i],
          value: qValue
        }

        Returns[id] = {
          id: id,
          state: state,
          action: predatorActions[i],
          value: []
        };
      }
    });

    policy = initPolicy();

    return {Q: Q, Returns: Returns, policy: policy};
  }

  // get prey possible actions
  var getPreyPossibleActions = function(feedbackPredatorCoord) {
    var preyPossibleActions = [];

    for (var i = 0; i < preyActions.length; i++) {
      if (transitionFunction(feedbackPredatorCoord, 'prey', preyActions[i], worldSize) !== '0_0') {
        preyPossibleActions.push(preyActions[i]);
      }

      if (preyPossibleActions.length < 5) {
        for (var j = 1; j < preyPossibleActions.length; j++) {
          preyPossibleActions[j].probability = (1 - preyPossibleActions[0].probability) / (preyPossibleActions.length - 1);
        }
      }
    }

    return preyPossibleActions;
  }

  // move prey based on possible actions
  var movePrey = function(preyPossibleActions) {
    var random = Math.random();
    var action;

    if (random <= preyPossibleActions[0].probability) {
      action = preyPossibleActions[0];
    } else {
      var idAction = Math.floor(Math.random() * (preyPossibleActions.length - 1) + 1);
      action = preyPossibleActions[idAction];
    }

    return action;
  }

  // generate episode under given policy
  var generateEpisode = function(policy, Q, startState) {
    // pick a state as start space
    // var keys = Object.keys(stateSpace);
    // var idState = Math.floor(Math.random() * keys.length);
    // var state = stateSpace[keys[idState]];
    var state = startState;

    var episode = [];

    // generate set of state, action, reward
    while (state.id !== '0_0') {
      var predatorAction = epsilonGreedyPolicy(epsilon, state, policy);
      // var predatorAction = policy[state.id];
      var feedbackPredator = transitionFunction(state.coord, 'predator', predatorAction, worldSize);

      if (feedbackPredator === '0_0') {
        var nextState = _.findWhere(stateSpace, {id: feedbackPredator});
      } else {
        var feedbackPredatorCoord = {
          x: feedbackPredator.split('_')[0] * 1.0,
          y: feedbackPredator.split('_')[1] * 1.0
        };

        // find legal actions of prey
        var preyPossibleActions = getPreyPossibleActions(feedbackPredatorCoord);

        // prey move randomly
        var preyAction = movePrey(preyPossibleActions);
        var feedbackPrey = transitionFunction(feedbackPredatorCoord, 'prey', preyAction, worldSize);

        var nextState = _.findWhere(stateSpace, {id: feedbackPredator});
      }

      episode.push({
        state: state,
        action: predatorAction
      });
      state = nextState;
    }

    // add terminal state
    episode.push({state: state});

    return episode;
  }

  // cumulative return start from state s, already taken action a
  // only start from first occurence of s,a
  var returnFunction = function(currentStateAction, episode, gamma) {
    // find first occurence of stateAction
    var idFirst = episode.indexOf(currentStateAction);
    var sumR = 0;
    var t = 0;

    for (var i = idFirst; i < episode.length; i++) {
      if (episode[i].state.id == '0_0') {
        var r = world.maxReward;
      } else {
        var r = 0;
      }

      sumR += Math.pow(gamma, t) * r;
      t++;
    }

    return sumR;
  }

  // average value of given array
  var average = function(arr) {
    var sum = arr.reduce(function(a,b){return a+b});
    return sum / arr.length;
  }

  // get unique state from given episode
  var getUniqueState = function(episode) {
    // minus terminal state
    var subEpisode = episode.slice(0, episode.length - 1);
    var uniqueStateId = [];

    for (var i = 0; i < subEpisode.length; i++) {
      var stateId = subEpisode[i].state.id;

      if (uniqueStateId.indexOf(stateId) == -1) {
        uniqueStateId.push(stateId);
      }
    }

    return uniqueStateId;
  }

  var getOptimumAction = function(stateId, Q) {
    // get all actions given stateId
    var keys = Object.keys(Q);
    var subKeys = keys.filter(function(e){return Q[e].state.id == stateId});
    var max = 0;
    var optimumAction;

    for (var i = 0; i < subKeys.length; i++) {
      if (Q[subKeys[i]].value >= max) {
        max = Q[subKeys[i]].value;
        optimumAction = Q[subKeys[i]].action;
      }
    }

    return optimumAction;
  }

  // update policy
  var updatePolicy = function(oldPolicy, actionStar, stateId) {
    var policy = oldPolicy;
    var greedy;
    var random = [];

    for (var i = 0; i < predatorActions.length; i++) {
      if (predatorActions[i].action == actionStar.action) {
        greedy = predatorActions[i];
      } else {
        random.push(predatorActions[i]);
      }

      policy[stateId] = {greedy: greedy, random: random};
    }

    return policy;
  }

  // =====================
  // Main Algorithm
  // =====================

  if (epsilon == undefined) {
    var epsilon = 0.1;
  }

  if (gamma == undefined) {
    var gamma = 0.9;
  }

  if (n == undefined) {
    var n = 100;
  }

  // Initialize Q, Returns, and Policy
  var result = initialization(epsilon);
  var Q = result.Q;
  var Returns = result.Returns;
  var policy = result.policy;
  var startState = stateSpace['5_5'];
  var result = [];


  // repeat forever
  for (var iter = 0; iter < n; iter++) {
    console.log('iteration = ', iter);
    // generate episode using policy
    var episode = generateEpisode(policy, Q, startState);
    result.push(episode.length);
    console.log('episode length = ', episode.length);

    // for each state,action pair in the episode
    for(var i = 0; i < episode.length - 1; i++) {
      var currentState = episode[i].state;
      var currentAction = episode[i].action;

      // return following first occurence of state,action pair and append to returns
      var tempId = currentState.id + '_' + currentAction.action;
      var R = returnFunction(episode[i], episode, gamma);

      Returns[tempId].value.push(R);
      Q[tempId].value = average(Returns[tempId].value);
    }

    // for each s in the episode
    var uniqueStates = getUniqueState(episode);
    for (var i = 0; i < uniqueStates.length; i++) {
      // argmax action for given state in episode
      actionStar = getOptimumAction(uniqueStates[i], Q);

      // update policy
      policy = updatePolicy(policy, actionStar, uniqueStates[i]);
    }
  }

  drawChart(result, 100);
  console.log('episode = ', episode);
  console.log('policy = ', policy);
}
