/**
 * Q-learning for Single Agent Learning
 * @param alpha = learning rate
 * @param gamma = discount factor
 * @param actionSelectionPolicy = 'greedy' or 'soft'
 * @param epsilon = action selection variable
 * @constructor
 */
// module.exports = function (options, callback) {
module.exports = function (options) {

  if (!options) {
    options = {};
  }

  var numbers = require('numbers');

  options.results = [];

  // properties
  var world = new World();
  world.setSize(11);
  world.isLogEnabled = false;

  var worldSize = world.getSize();

  var possibleActions = [
    { index: 0, action: 'stay', transition: { x: 0, y: 0 }, probability: 0.2 },
    { index: 1, action: 'left', transition: { x: -1, y: 0 }, probability: 0.2 },
    { index: 2, action: 'right', transition: { x: 1, y: 0 }, probability: 0.2 },
    { index: 3, action: 'up', transition: { x: 0, y: -1 }, probability: 0.2 },
    { index: 4, action: 'down', transition: { x: 0, y: 1 }, probability: 0.2 }
  ];

  var singleStateSpace = new OptimizedStateSpace(worldSize, 0);

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
    options.nLearning = 500;
  }

  if (!options.actionSelector) {
    options.actionSelector = 'softmax';
  }

  if (!options.initQ) {
    options.initQ = 0;
  }


  // =================
  // Helper Function
  // =================

  // check terminal state
  var checkTerminal = function(array) {
    terminal = false;

    for (var i = 0, len = array.length; i < len; i++) {
      var state = array[i];

      if (state.id == '0_0') {
        terminal = true;
        break;
      }
    }

    return terminal;
  }

  // check terminal all agents
  var checkTerminalAgents = function(agents) {
    var terminal = false;

    for (var i = 0, len = agents.length; i < len; i++) {
      if (checkTerminal(agents[i].currentState.combinations)) {
        terminal = true;
        break;
      }
    }

    return terminal;
  }

  // check whether prey catched
  var catchPrey = function(agents) {
    var collision = false;
    var cat = false;

    for (var i = 0, len = agents.length; i < len; i++) {
      var combinations = agents[i].currentState.combinations;

      for (var j = 0, len = combinations.length - 1; j < len; j++) {
        if (combinations[j].id == '0_0') {
          collision = true;
          break;
        }
      }
    }

    if (collision == false && checkTerminal(agents[agents.length - 1].currentState.combinations)) {
      cat = true;
    }

    return cat;
  }

  // initialize Q values
  var initQVal = function(array) {
    var actionValues = []

    // if state is not terminal, set value to 15
    _.each(possibleActions, function (action) {
      if (!checkTerminal(array)) {
        action.value = options.initQ;
      } else {
        action.value = 0;
      }

      actionValues.push(_.clone(action));
    });

    return actionValues;
  }

  // initialize state space
  // Thanks to Stack Overflow
  // http://stackoverflow.com/questions/15658391/loop-through-arrays-logging-all-combinations

  // encode relative distance
  var getCurrentStateId = function(position, otherPositions) {
    var ids = [];

    for (var i = 0, len = otherPositions.length; i < len; i++) {
      ids.push(encodeRelativeDistance(position.position, otherPositions[i].position, worldSize));
    }

    return ids;
  }

  // get current state
  var getCurrentState = function(ids) {
    var combined = [];
    var id = ids.join("_");

    for (var i = 0, len = ids.length; i < len; i++) {
      combined.push(singleStateSpace[ids[i]]);
    }

    var currentState = {id: id, combinations: combined, actionValues: initQVal(combined)};

    return currentState;
  }

  // initialize agents
  var initAgents = function(agentPositions) {
    var agents = [];

    for (var i = 0, len = agentPositions.length; i < len; i++) {
      var positions = _.clone(agentPositions);
      var position = agentPositions[i];

      positions.splice(positions.indexOf(position), 1);
      var otherPositions = positions;
      var currentStateIds = getCurrentStateId(agentPositions[i], otherPositions);
      var currentState = getCurrentState(currentStateIds);

      var stateSpace = {};
      stateSpace[currentStateIds.join("_")] = currentState;

      var agent = new Agent(world, {
        state: position.position,
        failFactor: position.failFactor,
        actions: possibleActions,
        stateSpace: stateSpace,
        currentState: currentState,
        previousState: {},
        type: position.type
      })

      agents.push(agent);
    }

    return agents;
  }

  // function that used by agent to take action
  var agentTakeAction = function(agent) {
    var random = Math.random();

    if (random > agent.failFactor) {
      var action = actionSelection(options.actionSelector, {
        epsilon: options.epsilon,
        currentStateIndex: agent.currentState.id,
        stateSpace: agent.stateSpace
      })
    } else {
      var action = possibleActions[0];
    }

    return action;
  }

  // agents take action
  var agentsTakeAction = function(agents) {
    var actions = [];

    for (var i = 0, len = agents.length; i < len; i++) {
      actions.push(agentTakeAction(agents[i]))
    }

    return actions;
  }

  // update position agent
  var updatePosition = function (agent, action) {
    var initState = agent.state;

    var finalState = {
      x: initState.x + action.transition.x,
      y: initState.y + action.transition.y
    };

    // toroidal
    if (finalState.x < 0) {
      finalState.x = worldSize - 1;
    }

    if (finalState.x >= worldSize) {
      finalState.x = 0;
    }

    if (finalState.y < 0) {
      finalState.y = worldSize - 1;
    }

    if (finalState.y >= worldSize) {
      finalState.y = 0;
    }

    return {position: finalState};
  }

  // update agent positions
  var updateAgentsPosition = function(agents, actions) {
    var arr = [];
    var newAgents = [];

    // get end position for all agents
    for (var i = 0, len = agents.length; i < len; i++) {
      var agent = agents[i];
      var action = actions[i];

      arr.push(updatePosition(agent, action));
    }

    // recalculate relative distance
    for (var i = 0, len = arr.length; i < len; i++) {
      var positions = _.clone(arr);
      var position = arr[i];
      var newAgent = _.clone(agents[i]);
      var stateSpace = newAgent.stateSpace;

      positions.splice(positions.indexOf(position), 1);
      var otherPositions = positions;
      var currentStateIds = getCurrentStateId(position, otherPositions);
      var joinIds = currentStateIds.join("_");

      if (stateSpace[joinIds] == undefined) {
        var currentState = getCurrentState(currentStateIds);
        stateSpace[joinIds] = currentState;
      } else {
        var currentState = stateSpace[joinIds];
      }

      newAgent.state = position.position;
      newAgent.stateSpace = stateSpace;
      newAgent.previousState = newAgent.currentState;
      newAgent.currentState = currentState;

      newAgents.push(newAgent);
    }

    return newAgents;
  }

  // update agents action values
  var updateAgentsActionValues = function(agents, actions, reward) {
    var arr = [];

    for (var i = 0, len = agents.length; i < len; i++) {
      var agent = agents[i];
      var action = actions[i];

      arr.push(agent.updateActionValues(options.alpha, options.gamma, action, reward));
    }

    return arr;
  }

  // calculate rewards
  var calculateRewards = function(agents) {
    var predatorReward = 0;
    var preyReward = 0;

    var predatorCollision = false;
    var preyCatch = false;

    for (var i = 0, len = agents.length; i < len; i++) {
      var agent = agents[i];
      var relativeDistances = agent.currentState.combinations;

      if (agent.type == 'predator' && predatorCollision == false) {
        // check predators end up in the same state
        for (var j = 0, lenn = relativeDistances.length - 1; j < lenn; j++) {
          var state = relativeDistances[j];

          if (state.id == '0_0') {
            predatorCollision = true;

            predatorReward = -10;
            preyReward = 10;

            break;
          }
        }
      } else if (agent.type == 'prey' && predatorCollision == false) {
        // check one of predator catch the prey
        for (var j = 0, lenn = relativeDistances.length - 1; j < lenn; j++) {
          var state = relativeDistances[j];

          if (state.id == '0_0') {
            preyCatch = true;

            predatorReward = 10;
            preyReward = -10;

            break;
          }
        }
      }
    }

    return {predator: predatorReward, prey: preyReward};
  }

  // reset position
  var resetPosition = function (agents, agentPositions) {
    var arr = [];

    for (var i = 0, len = agentPositions.length; i < len; i++) {
      var newAgent = _.clone(agents[i]);

      var positions = _.clone(agentPositions);
      var position = agentPositions[i];

      positions.splice(positions.indexOf(position), 1);
      var otherPositions = positions;
      var currentStateIds = getCurrentStateId(agentPositions[i], otherPositions);
      var joinIds = currentStateIds.join("_");
      var currentState = newAgent.stateSpace[joinIds];

      newAgent.state = position.position;
      newAgent.previousState = newAgent.currentState;
      newAgent.currentState = currentState;

      arr.push(newAgent);
    }

    return arr;
  }


  // =================
  // Main Algorithm
  // =================

  // initialize predators and prey
  var agentPositions = [
    {type: "predator", failFactor: 0, position: {x: 0, y: 0}},
    {type: "predator", failFactor: 0, position: {x: 10, y: 10}},
    {type: "predator", failFactor: 0, position: {x: 10, y: 0}},
    {type: "predator", failFactor: 0, position: {x: 0, y: 10}},
    {type: "prey", failFactor: 0.8, position: {x: 5, y: 5}},
  ];
  var nAgents = agentPositions.length;

  var agents = initAgents(agentPositions, singleStateSpace);

  for (var episode = 0; episode < options.nLearning; episode++) {

    // repeat until terminal or innerReach
    var agents = resetPosition(agents, agentPositions);

    var innerLoopStep = 0;

    do {
      // agents take action
      var actions = agentsTakeAction(agents);

      // check end position after all predators and prey move
      // save current state to previous state
      // new state to current state
      var agents = updateAgentsPosition(agents, actions);

      // calculate reward
      var rewards = calculateRewards(agents);

      // update action values for previous state
      var agents = updateAgentsActionValues(agents, actions, rewards);

      innerLoopStep++;
    } while (checkTerminalAgents(agents) == false && innerLoopStep < 10000);

    if (!options.results) {
      options.results = [];
    }

    if (catchPrey(agents)) {
      console.log("trial", episode);
      console.log("number of steps", innerLoopStep);

      var _result = {
        step: innerLoopStep
      };

      options.results.push(_result);
    }
  }

  console.log('done #' + options.id);
  // for (var n = 0; n < agents.length; n++) {
  //   var keys = Object.keys(agents[n].stateSpace);
  //   console.log(keys.length);

  //   for (var i = 0; i < keys.length; i++) {
  //     var av = agents[n].stateSpace[keys[i]].actionValues;

  //     for (var j = 0; j < av.length; j++) {
  //       console.log(av[j].value);
  //     }
  //     console.log("--------------");
  //   }
  //   console.log("=============");
  // }

  return options.results;
};
