module.exports = function (opt) {

  // init constructor
  opt = opt || {};

  opt.worldSize = opt.worldSize || 11;

  var world = new World();
  world.setSize(opt.worldSize);
  world.isLogEnabled = false;

//  console.log(world);
  var agentAction = [
    { index: 0, action: 'stay', transition: { x: 0, y: 0 }, probability: 0.2 },
    { index: 1, action: 'left', transition: { x: -1, y: 0 }, probability: 0.2 },
    { index: 2, action: 'right', transition: { x: 1, y: 0 }, probability: 0.2 },
    { index: 3, action: 'up', transition: { x: 0, y: -1 }, probability: 0.2 },
    { index: 4, action: 'down', transition: { x: 0, y: 1 }, probability: 0.2 }
  ];

  // spawn predator and prey
  // -- minimum 1-4 predator
  opt.initPredator = opt.initPredator || [
    {x: 0, y: 0}
  ];

  // update Prey Action
  // update Predator Action

  _.each(opt.initPredator, function (predatorInitState) {
    world.spawnPredator(predatorInitState, agentAction, 0);
  });

  // -- minimum 1 prey
  opt.initPrey = opt.initPrey || [
    {x: 5, y: 5}
  ];

  _.each(opt.initPrey, function (preyInitState) {
    world.spawnPrey(preyInitState, agentAction, 0.2);
  });

  this.world = world;

  this.runSingleEpisode = function (callbackFn) {

    var getAgents = function () {
      return {
        predators: world.predators,
        preys: world.preys
      };
    };

    var steps = [];
    var masStep = function (steps, detailConverge) {

      // push current state
      steps.push({
        converge: false,
        state: detailConverge,
        predators: _.pluck(getAgents().predators, 'state'),
        preys: _.pluck(getAgents().preys, 'state')
      });

      world.MASstep(function (isConverge, detailConverge) {
        if (!isConverge) {
          masStep(steps, detailConverge);
        } else {

          // push current state
          steps.push({
            converge: true,
            state: detailConverge,
            predators: _.pluck(getAgents().predators, 'state'),
            preys: _.pluck(getAgents().preys, 'state')
          });

          callbackFn({ steps: steps});
        }
      });
    };

    masStep(steps);
  };

  var self = this;

  return self;
};