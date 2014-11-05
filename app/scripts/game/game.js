'use strict';

angular.module('Game', ['Grid', 'ngCookies'])
  .service('GameManager', function (GridService) {

    this.previewAtStep = function (step) {
      this.steps = this.story[step].steps;
      this.predators =  this.story[step].predators;
      this.preys =  this.story[step].preys;
    };

    this.reinit = function () {
      this.win = false;
      this.grid = GridService.grid;
      this.worldSize = GridService.getSize();
      this.story = GridService.solveSimulation();
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
      var predatorDefaultState = [0,0].join(',');
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
          settings.worldSize-1,
          settings.worldSize-1].join(',');

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
