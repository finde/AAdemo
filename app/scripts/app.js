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
      finalStep:0
    };

    var self = this;

    this.newGame = function () {
      this.settings.currentStep = 0;
      delete this.settings.stats;

      this.game.newGame(this.settings);

      this.settings.finalStep = this.game.story.length -1; // 0 based
      this.previewStep();
    };

    this.stepOnce = function () {
      this.settings.currentStep++;
      this.previewStep();
    };

    this.previewStep = function () {
      this.game.previewAtStep(this.settings.currentStep);
    };

    this.simulate = function (){

      this.settings.stats = { message: 'calculating...' };
      $timeout( function () {
        new Simulator(100, self.settings, function (stats) {
          self.settings.stats = stats;
        });
      },1);
    };

    this.newGame();
  });
