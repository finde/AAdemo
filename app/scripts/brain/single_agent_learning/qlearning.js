/**
 * Q-learning for Single Agent Learning
 * @param alpha = learning rate
 * @param gamma = discount factor
 * @param actionSelectionPolicy = 'greedy' or 'soft'
 * @param epsilon = action selection variable
 * @constructor
 */
var QLearning = function (options) {

  if (!options) {
    options = {};
  }

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

  var predatorActions = world.getPredatorActions();
  var preyActions = world.getPreyActions();

  // method's
  var rand = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  var actionSelection = function (actionSelector, opts) {
    var softmaxActionSelection = function (currentStateIndex, stateSpace) {

      var actionValues = _.pluck(stateSpace[currentStateIndex].actionValues, 'value');

      var expValues = [];
      _.each(actionValues, function (actionValue) {
        expValues.push(Math.exp(actionValue));
      });

      var randomValue = Math.random() * numbers.basic.sum(expValues);

      for (var i = 0; i < _.size(actionValues); i++) {
        if (randomValue <= expValues[i]) {
          return stateSpace[currentStateIndex].actionValues[i];
        } else {
          randomValue -= expValues[i];
        }
      }

      // to ensure it return something
      return _.first(stateSpace[currentStateIndex].actionValues);
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

    switch (actionSelector) {
      case 'greedy':
        console.log('greedy');
        return greedyActionSelections(opts.epsilon, opts.currentStateIndex, opts.stateSpace);

      case 'softmax':
        console.log('softmax');
        return softmaxActionSelection(opts.currentStateIndex, opts.stateSpace);
    }
  };

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
        state.actionValues.push(_.clone(action));
      });

    });
  }

  // for each episode - until n times
  var a, s, sPrime, r;
  for (var episode = 0; episode < options.nLearning; episode++) {

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
    } while (s !== '0_0');

    if (!options.results) {
      options.results = [];
    }
    options.results.push(innerLoopStep);

    console.log('episode:', episode);
  }

  function averagingData(data, nPoints) {
    var batchSize = _.size(data) / nPoints;
    var _results = {
      labels: [],
      data: []
    };

    var i = 0, x = 0;
    while (i < _.size(data)) {

      var temp = [];
      for (var j = 0; j < batchSize && i < _.size(data); j++, i++) {
        temp.push(data[i]);
      }

      _results.labels.push(++x);
      _results.data.push(numbers.statistic.mean(temp));
    }

    return _results;
  }

  var results = averagingData(options.results, 100);
  console.log(results);

  var data = {
    labels: results.labels,
    datasets: [
      {
        label: "results",
        fillColor: "rgba(220,220,220,0.2)",
        strokeColor: "rgba(220,220,220,1)",
        pointColor: "rgba(220,220,220,1)",
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: results.data
      }
    ]
  };

  var scenario = [];
  scenario.push({predator: {x: 0, y: 0}, prey: {x: 5, y: 5}});
  scenario.push({predator: {x: 2, y: 3}, prey: {x: 5, y: 4}});
  scenario.push({predator: {x: 2, y: 10}, prey: {x: 10, y: 0}});
  scenario.push({predator: {x: 10, y: 10}, prey: {x: 0, y: 0}});

  _.each(scenario, function (s) {
    console.log(options.stateSpace[encodeRelativeDistance(s.predator, s.prey, worldSize)]);
  });


  // updated chart
  var ctx = document.getElementById("chart").getContext("2d");
  var myLineChart = new Chart(ctx).Line(data, {pointDot: false, responsive: true, maintainAspectRatio: false});

  $('#stateSpaceOutput').text(JSON.stringify(options));
};

var reRunQLearning = function (opts) {

  function isValidJson(json) {
    try {
      JSON.parse(json);
      return true;
    } catch (e) {
      return false;
    }
  }

  var source = $('#stateSpaceOutput').text();
  if (isValidJson(source)) {
    opts = JSON.parse(source);
  }

  QLearning(opts);

};