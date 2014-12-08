module.exports = function (world, initSettings) {

  /// properties - default values
  var world = world; // world binding references
  var actions = [
    { action: 'stay', transition: { x: 0, y: 0 }, probability: 0.2 },
    { action: 'left', transition: { x: -1, y: 0 }, probability: 0.2 },
    { action: 'right', transition: { x: 1, y: 0 }, probability: 0.2 },
    { action: 'up', transition: { x: 0, y: -1 }, probability: 0.2 },
    { action: 'down', transition: { x: 0, y: 1 }, probability: 0.2 }
  ];

  var failFactor = 0;

  this.state = { x: 0, y: 0 };
  var agent = this;

  // methods
  this.init = function (initSettings) {
    if (initSettings) {
      agent.state = initSettings.state || agent.state;
      actions = initSettings.actions || actions;
      failFactor = initSettings.failFactor || failFactor;
    }
  };
  this.init(initSettings);

  this.takeAction = function (options) {
    do {
      var _action = this.randomAction();
      var feedback = world.giveFeedback(agent.state, _action, options);
    } while (feedback == false);

    agent.state = feedback.state;
    return feedback.reward;
  };

//  // ignore legal move
  this.takeActionMAS = function () {
    if (Math.random() > failFactor) {
      var _action = this.randomAction();
      var feedback = world.giveFeedback(agent.state, _action);

      console.log('success', _action.action);
      agent.state = feedback.state;

      return feedback.state;

    } else {
      console.log('fail');

      return agent.state;
    }

  };

  // private function
  var rand = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  var generateWeighedList = function (list) { 
    var weighed_list = [];

    // Loop over weights
    for (var i = 0; i < list.length; i++) {
      var multiples = list[i].probability * 100; // 2 digits precision

      // Loop over the list of items
      for (var j = 0; j < multiples; j++) {
        weighed_list.push(list[i]);
      }
    }

    return weighed_list;
  };

  this.randomAction = function () {
    var weighed_list = generateWeighedList(actions);
    var random_num = rand(0, weighed_list.length - 1);
    return weighed_list[random_num];
  };

  return agent;
};
