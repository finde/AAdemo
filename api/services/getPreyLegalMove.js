module.exports = function (currentState, preyActions, worldSize) {
  var preyLegalActions = [];
  for (var j = 0; j < preyActions.length; j++) {

    //if this is legal then add to the list
    if (transitionFunction(currentState, 'prey', preyActions[j], worldSize) !== '0_0') {
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

  return preyLegalActions;
};