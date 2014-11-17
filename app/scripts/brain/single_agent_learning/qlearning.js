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
    gamma = 0.8; // 0.1, 0.5, 0.7, 0.9
  }

  if (!alpha) {
    alpha = 0.5; // 0.1 ... 0.5
  }

  if (!epsilon) {
    epsilon = 0.1;
  }

  if (!nLearning) {
    nLearning = 500;
  }

  var predatorActions = world.getPredatorActions();
  var preyActions = world.getPreyActions();

  // method's
  var rand = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  var greedyActionSelections = function (epsilon, currentStateIndex, stateSpace) {
    var random = Math.random();

    var action; // action Object
    if (random < epsilon) {
      // choose random action
      action = predatorActions[rand(0, _.size(predatorActions) - 1)];
    } else {
      // choose argmax q(s,a)
      var actionValues = _.pluck(stateSpace[currentStateIndex].actionValues, 'value');
      var maxValue = numbers.basic.max(actionValues);

      for (var i = 0; i < actionValues.length; i++) {
        if (actionValues[i] == maxValue) {
          action = stateSpace[currentStateIndex].actionValues[i];
          break;
        }
      }
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
  var a, s, sPrime, r, results = [], trials = [];
  for (var episode = 0; episode < nLearning; episode++) {

    // Init s
    s = encodeRelativeDistance({x: 0, y: 0}, {x: 5, y: 5}, worldSize);

    // repeat until terminal or innerReach
    var innerLoopStep = 0;
    do {
      // choose a from s using policy derived from Q (e.e e-greedy)
      a = greedyActionSelections(epsilon, s, stateSpace);

      // take action a, observe r and s'
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

      // update q(s,a)
      var actionValues = _.pluck(stateSpace[sPrime].actionValues, 'value');
      var qSPrimeA = numbers.basic.max(actionValues);

      stateSpace[s].actionValues[a.index].value += alpha * (r + gamma * qSPrimeA - stateSpace[s].actionValues[a.index].value);

      // update s <- s'
      s = sPrime;

      innerLoopStep++;
    } while (s !== '0_0');

    results.push(innerLoopStep);
    trials.push(episode);

    console.log(episode);
  }

//  return results;

  var data = {
    labels: trials,
    datasets: [
      {
        label: "results",
        fillColor: "rgba(220,220,220,0.2)",
        strokeColor: "rgba(220,220,220,1)",
        pointColor: "rgba(220,220,220,1)",
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: results
      }
    ]
  };

  var scenario = [];
  scenario.push({predator: {x: 0, y: 0}, prey: {x: 5, y: 5}});
  scenario.push({predator: {x: 2, y: 3}, prey: {x: 5, y: 4}});
  scenario.push({predator: {x: 2, y: 10}, prey: {x: 10, y: 0}});
  scenario.push({predator: {x: 10, y: 10}, prey: {x: 0, y: 0}});

  _.each(scenario, function (s) {
    console.log(stateSpace[encodeRelativeDistance(s.predator, s.prey, worldSize)]);
  });


  // add element to body
  $('#chart').remove();
  $('body').append('<canvas id="chart" width="600" height="400" style="position: absolute; top: 320px; left: 120px;"></canvas>');

  // updated chart
  var ctx = document.getElementById("chart").getContext("2d");
  var myLineChart = new Chart(ctx).Line(data, {pointDot: false});
};