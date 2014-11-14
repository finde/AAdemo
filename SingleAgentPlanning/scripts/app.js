'use strict';

angular
  .module('gridWorldApp', ['Game', 'Grid', 'Actor', 'ngAnimate', 'ngCookies', 'SafeApply'])
  .config(function (GridServiceProvider) {
    GridServiceProvider.setSize(11);
  })
  .controller('GameController', function (GameManager, $timeout, $interval, $q) {
    var self = this;
    var simulator;
    this.game = GameManager;

    this.settings = {
      currentStep: 0,
      finalStep: 0,
      worldSize: 11,
      predatorInitLocation: '0,0',
      predatorInitState: {x: 0, y: 0},
      preyInitLocation: '5,5',
      pryInitState: {x: 5, y: 5}
    };

    this.calculatedPlan = {};
    this.isBusy = false;
    this.isReady = {};

    this.resetButtons = function () {
      this.isReady = {
        'randomPolicy': false,
        'policyEvaluation': false,
        'policyIteration': false,
        'valueIteration': false
      };

      self.settings.currentStep = 0;
      self.settings.finalStep = 0;
      self.calculatedPlan = {};
      self.selectedMode = '';
    };
    this.resetButtons();

    this.newGame = function () {
      if (!!self.isBusy) {
        return false;
      }

      self.isBusy = true;

      self.settings.currentStep = 0;
      delete self.settings.stats;

      // set all mode-button to disabled
      this.resetButtons();

      self.message = 'planning... (check the console to see the detail)';

      alert('please wait for a moment while the system is running the calculation');

      // reset board
      self.game.newGame(self.settings, function () {

        simulator = new Simulator(self.settings);
        self.settings.finalStep = self.game.story.length - 1; // 0 based
        self.previewStep();

        // random policy
//          self.message = 'calculating random policy statistics...';

        simulator.randomPolicy(100, function (stats) {
          self.calculatedPlan.randomPolicy = {stats: stats};
          self.isReady.randomPolicy = true;
        });

        // policy evaluation
//          self.message = 'calculating policy evaluation...';
        var scenario = [];
        scenario.push({predator: {x: 0, y: 0}, prey: {x: 5, y: 5}});
        scenario.push({predator: {x: 2, y: 3}, prey: {x: 5, y: 4}});
        scenario.push({predator: {x: 2, y: 10}, prey: {x: 10, y: 0}});
        scenario.push({predator: {x: 10, y: 10}, prey: {x: 0, y: 0}});

        simulator.policyEvaluation(scenario, function (_scenario, valueGrid) {
          self.calculatedPlan.policyEvaluation = {valueGrid: valueGrid, scenario: scenario};
          self.isReady.policyEvaluation = true;
        });

        // policy iteration
//          self.message = 'calculating policy iteration...';
        var discountFactors = [0.1, 0.5, 0.7, 0.9];
        simulator.policyIteration(discountFactors, function (results) {
          self.calculatedPlan.policyIteration = _.clone(results);
          self.isReady.policyIteration = true;
        });

        // value iteration
//          self.message = 'calculating value iteration...';
        var discountFactors = [0.1, 0.5, 0.7, 0.9];
        simulator.valueIteration(discountFactors, function (results) {
          self.calculatedPlan.valueIteration = _.clone(results);
          self.isReady.valueIteration = true;
        });

        self.isBusy = false;

        self.message = 'planning done, click button below to see the result ↓';
        // printing report
      });
    };

    this.stepOnce = function () {
      if (self.settings.currentStep < self.settings.finalStep) {
        self.settings.currentStep++;
        self.previewStep();

        self.drawPolicy();
      } else {
        self.player.stop();
      }
    };

    this.drawPolicy = function () {

      var memory = false;
      var prey = _.first(self.game.preys).state;

      // show grid value based on prey location and mode
      switch (self.selectedMode) {
        case 'policyEvaluation':
          var result = self.calculatedPlan.policyEvaluation;
          if (!memory || !isSameLocation(memory, prey)) {
            self.game.updateGridPolicy(result, prey);
          }
          memory = _.clone(prey);
          break;

        case 'policyIteration':
          var result = _.first(self.calculatedPlan.policyIteration);
          if (!memory || !isSameLocation(memory, prey)) {
            self.game.updateGridPolicy(result, prey);
          }
          memory = _.clone(prey);
          break;

        case 'valueIteration':
          var result = _.first(self.calculatedPlan.valueIteration);
          if (!memory || !isSameLocation(memory, prey)) {
            self.game.updateGridPolicy(result, prey);
          }
          memory = _.clone(prey);
          break;
      }

    }

    this.previewStep = function () {
      this.game.previewAtStep(this.settings.currentStep);
    };

    this.player = {
      isPlay: false,
      stop: function () {
        self.player.isPlay = false;
      },
      getObject: $interval(function () {
        if (!!self.player.isPlay) {
          self.stepOnce();
        }
      }, 500),

      play: function () {
        if (self.settings.currentStep < self.settings.finalStep) {
          self.player.isPlay = !self.player.isPlay;
        }
      },

      stepForward: function () {
        self.player.isPlay = false;
        self.stepOnce();
      }
    };

    self.message = 'Click \'start\' to begin the simulation →';

    self.modes = [
      {id: 'policyEvaluation', name: 'Policy Evaluation'},
      {id: 'policyIteration', name: 'Policy Iteration'},
      {id: 'valueIteration', name: 'Value Iteration'}
    ];

    self.selectedMode = '';
    self.selectMode = function (mode) {
      self.selectedMode = mode;

      // on select mode // redraw the policy
      self.drawPolicy();
    };

    self.isShowResult = false;
    self.showTestResult = function () {
      self.isShowResult = !self.isShowResult;
    };

  });
