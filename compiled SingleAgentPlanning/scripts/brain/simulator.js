'use strict';

// simulator functions
var Simulator = function (opt) {

  var world = new World();
  world.setSize(opt.worldSize);
  world.isLogEnabled = false;

  world.spawnPredator(opt.predatorInitState);
  world.spawnPrey(opt.preyInitState);

  this.randomPolicy = function (nTimes, callbackFn) {

    // prepare result
    var simulations = [];
    for (var i = 0; i < nTimes; i++) {

      //simulation function
      simulations.push(function (callback) {

        var self = {};
        self.world = _.clone(world);

        return callback(null, self.world.runSimulation());
      });
    }

    var stats = {};

    // run on async
    async.parallel(simulations, function (error, results) {

      stats = {
        standardDev: numbers.statistic.standardDev(results),
        mean: numbers.statistic.mean(results),
        data: results
      };

      if (!!callbackFn && typeof callbackFn == 'function') {
        return callbackFn(stats);
      }
    });

    return stats;
  };

  this.policyEvaluation = function (scenario, callbackFn) {
    var self = {};
    self.world = _.clone(world);

    var policyEvaluation = new PolicyEvaluation(0.8, 0.001, self.world);

    // run once
    var policy = policyEvaluation.runPlanning();

    var _scenario = _.clone(scenario);
    for (var i = 0; i < _scenario.length; i++) {

      _scenario[i].policy = policyEvaluation.getStatePolicy(_scenario[i].predator, _scenario[i].prey);

    }

    if (!!callbackFn && typeof callbackFn == 'function') {
      return callbackFn(_scenario, policy);
    }

    return _scenario;
  };

  this.policyIteration = function (discountFactors, callbackFn) {
    var self = {};
    self.world = _.clone(world);

    var results = [];
    // for each discount factor
    _.each(discountFactors, function (discountFactor) {
      var policyIterationResult = new PolicyIteration(discountFactor, 0.001, self.world);

      results.push({
        discountFactor: discountFactor,
        iteration: policyIterationResult.iteration,
        policy: policyIterationResult.policy,
        stateSpace: policyIterationResult.stateSpace
      });

    });

    if (!!callbackFn && typeof callbackFn == 'function') {
      return callbackFn(results);
    }

    return results;
  };

  this.valueIteration = function (discountFactors, callbackFn) {
    var self = {};
    self.world = _.clone(world);

    var results = [];
    // for each discount factor
    _.each(discountFactors, function (discountFactor) {
      var valueIterationResult = new ValueIteration(discountFactor, 0.001, self.world);

      results.push({
        discountFactor: discountFactor,
        iteration: valueIterationResult.iteration,
        policy: valueIterationResult.policy,
        stateSpace: valueIterationResult.stateSpace
      });

    });

    if (!!callbackFn && typeof callbackFn == 'function') {
      return callbackFn(results);
    }

    return results;
  };

};