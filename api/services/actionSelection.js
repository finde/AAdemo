var numbers = require('numbers');
module.exports = function (actionSelector, opts) {
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

    var world = new World();
    world.setSize(11);
    world.isLogEnabled = false;
    var predatorActions = world.getPredatorActions();

    var action; // action Object
    if (random < epsilon) {
      // choose random action
      action = stateSpace[currentStateIndex].actionValues[rand(0, _.size(predatorActions) - 1)];
    } else {
      var actionValues = _.pluck(stateSpace[currentStateIndex].actionValues, 'value');
      var maxValue = numbers.basic.max(actionValues);

      for (var i = 0; i < actionValues.length; i++) {
        // if multiple actions have maxValue, use the first one
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
      return greedyActionSelections(opts.epsilon, opts.currentStateIndex, opts.stateSpace);

    case 'softmax':
      return softmaxActionSelection(opts.currentStateIndex, opts.stateSpace);
  }
};