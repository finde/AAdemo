'use strict';

var Simulator = function (nTimes, opt, callbackFn){

  // prepare result
  var simulations = [];
  for (var i=0; i<nTimes; i++){
    //simulation function
    simulations.push(function (callback) {
      var self = {};

      self.world = new World();
      self.world.setSize(opt.worldSize);
      self.world.isLogEnabled = false;
      self.world.spawnPredator(opt.predatorInitState);
      self.world.spawnPrey(opt.preyInitState);

      return callback(null, self.world.solveSimulation());
    });
  }

  var stats = {};

  // run on async
  async.parallel(simulations, function (error, results){

    stats = {
      standardDev: numbers.statistic.standardDev(results),
      mean: numbers.statistic.mean(results),
      data: results
    };

    if (!!callbackFn){
      return callbackFn(stats);
    }
  });

  return stats;
};