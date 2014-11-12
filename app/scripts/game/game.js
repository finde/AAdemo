'use strict';

angular.module('Game', ['Grid', 'ngCookies'])
  .service('GameManager', function (GridService) {

    this.previewAtStep = function (step) {
      this.steps = this.story[step].steps;
      this.predators = this.story[step].predators;
      this.preys = this.story[step].preys;
    };

    this.updateGridPolicy = function (policy, targetLoc) {

      // for each grid, get the encodedRelativeDistance
      // and print the policy based on that
      GridService.showPolicy(policy, targetLoc);

    };

    this.reinit = function () {
      this.win = false;
      this.grid = GridService.grid;
      this.worldSize = GridService.getSize();

      // run simulator once
      this.story = GridService.runSimulation();
    };

    this.newGame = function (settings) {

      // world
      if (settings && !settings.worldSize) {
        settings.worldSize = GridService.getSize();
      }

      GridService.setSize(settings.worldSize);
      GridService.buildEmptyGameBoard();

      // predator
      var _loc;
      var predatorDefaultState = [0, 0].join(',');
      if (settings && !settings.predatorInitLocation) {
        settings.predatorInitLocation = predatorDefaultState;
      }

      _loc = settings.predatorInitLocation.split(',');
      settings.predatorInitState = {
        x: parseInt(_loc[0]),
        y: parseInt(_loc[1])
      };
      GridService.spawnPredator(settings.predatorInitState);

      // prey
      var preyDefaultState = [
        Math.floor((settings.worldSize - 1) / 2),
        Math.floor((settings.worldSize - 1) / 2)].join(',');

      if (settings && !settings.preyInitLocation) {
        settings.preyInitLocation = preyDefaultState;
      }

      _loc = settings.preyInitLocation.split(',');
      settings.preyInitState = {
        x: parseInt(_loc[0]),
        y: parseInt(_loc[1])
      };
      GridService.spawnPrey(settings.preyInitState);

      this.reinit();
    };

  });
