'use strict';

angular
  .module('gridWorldApp', ['Game', 'Grid', 'Actor', 'ngAnimate', 'ngCookies'])
  .config(function (GridServiceProvider) {
    GridServiceProvider.setSize(11);
  })
  .controller('GameController', function (GameManager, $timeout) {

    this.game = GameManager;
    this.settings = {
      currentStep: 0,
      finalStep: 0
    };

    var self = this;
    var simulator;

    this.newGame = function () {
      this.settings.currentStep = 0;
      delete this.settings.stats;

      this.game.newGame(this.settings);

      // reset simulator
      simulator = new Simulator(this.settings);

      this.settings.finalStep = this.game.story.length - 1; // 0 based
      this.previewStep();
    };

    this.stepOnce = function () {
      this.settings.currentStep++;
      this.previewStep();
    };

    this.previewStep = function () {
      this.game.previewAtStep(this.settings.currentStep);
    };

    this.simulateRandomPolicy = function (nTimes) {

      this.settings.stats = { message: 'calculating...' };
      $timeout(function () {
        simulator.randomPolicy(nTimes, function (stats) {
          self.settings.stats = stats;
        });
      }, 1);
    };

    this.simulatePolicyEvaluation = function () {

      $timeout(function () {

        var scenario = [];
        scenario.push({predator: {x: 0, y: 0}, prey: {x: 5, y: 5}});
        scenario.push({predator: {x: 2, y: 3}, prey: {x: 5, y: 4}});
        scenario.push({predator: {x: 2, y: 10}, prey: {x: 10, y: 0}});
        scenario.push({predator: {x: 10, y: 10}, prey: {x: 0, y: 0}});

        simulator.policyEvaluation(scenario, function (_scenario) {

          _.each(_scenario, function (s) {
            console.log('=============================================');
            console.log(' Predator:', s.predator.x, ',', s.predator.y);
            console.log(' Prey:', s.prey.x, ',', s.prey.y);
            console.log(' Value:', s.policy);
          });

        });
      }, 1);

    };

    this.simulatePolicyIteration = function () {

      var game = this.game;
      var settings = this.settings;

      console.log(settings.preyInitState);
      $timeout(function () {

        var discountFactors = [0, 0.1, 0.5, 0.7, 0.9];
        console.log('running...');
        simulator.policyIteration(discountFactors, function (results) {

          // update grid text
          // only matter for the first one, because the rest should be the same
          game.updateGridPolicy(_.first(results), settings.preyInitState);

          _.each(results, function (r) {
            console.log('=============================================');
            console.log(' Discount Factor:', r.discountFactor);
            console.log(' Iteration:', r.iteration);
          });

        });

      }, 1);
    };

    this.simulateValueIteration = function () {

      var game = this.game;
      var settings = this.settings;

      console.log(settings.preyInitState);
      $timeout(function () {

        var discountFactors = [0.1, 0.5, 0.7, 0.9];
        console.log('running...');
        simulator.valueIteration(discountFactors, function (results) {

          game.updateGridPolicy(_.first(results), settings.preyInitState);

          _.each(results, function (r) {
            console.log('=============================================');
            console.log(' Discount Factor:', r.discountFactor);
            console.log(' Iteration:', r.iteration);
          });

        });


      }, 1);
    };

    this.newGame();
  });
