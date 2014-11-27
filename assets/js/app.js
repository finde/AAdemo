'use strict';

angular
  .module('gridWorldApp', ['Game', 'Grid', 'Actor', 'ngAnimate', 'ngRoute', 'highcharts-ng'])
  .config(function (GridServiceProvider, $routeProvider) {
    GridServiceProvider.setSize(11);

    $routeProvider
      // route for the home page
      .when('/', {
        templateUrl: 'views/main.html'
      })

      // route for the about page
      .when('/single-agent-planning', {
        templateUrl: 'views/single-agent-planning.html'
      })

      // route for the contact page
      .when('/single-agent-learning', {
        templateUrl: 'views/single-agent-learning.html'
      });

  })
  .controller('GameController', function (GameManager, $timeout, $interval) {
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

      // reset board
      $timeout(function () {
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
      }, 10);
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

    this.trials = [];

    this.config = {};
    this.config.nLearning = this.config.nLearning || 100;
    this.config.alpha = this.config.alpha || 0.1;
    this.config.gamma = this.config.gamma || 0.1;
    this.config.actionSelector = this.config.actionSelector || 'softmax';
    this.config.epsilon = this.config.epsilon || 0.1;
    this.config.initQ = this.config.initQ || 15;

    this.qlearning = function () {
      averagingFunction(10, QLearning, self.config, function (results) {
        self.trials.push({
          config: _.clone(self.config),
          result: results
        });

        updateGraph();
      });
    };

    this.runInference = function (config) {
      console.log(config);

      // validate the input
      for (var propertyName in config) {
        console.log(propertyName);

        console.log(config[propertyName]);
      }

      // find the requested inference
    };

    this.sarsa = function () {
      console.log('call parent function');
      averagingFunction(10, Sarsa, self.config, function (results) {

        console.log('done');

        self.trials.push({
          config: _.clone(self.config),
          result: results
        });

        updateGraph();
      });
    };

    var guid = (function () {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }

      return function () {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
          s4() + '-' + s4() + s4() + s4();
      };
    })();
    var averagingFunction = function (nTimes, learningFunction, opts, cb) {
      nTimes = nTimes || 5;
      var queue = [];
      for (var i = 0; i < nTimes; i++) {
        var id = guid();
        console.log('register #' + id);

        var parallelFn = function (id) {
          return function (callback) {
            console.log('>> process #' + id);
            return new learningFunction(opts, id, callback);
          }
        };

        queue.push(new parallelFn(id));
      }

      // run async
      async.parallel(queue,
        function (err, results) {
          var _results = _.clone(_.first(results));

          // for each trial
          for (var j = 1; j < _.size(results); j++) {
            var r = results[j];

            // sum each episode
            for (var e = 0; e < _.size(r); e++) {
              _results[e].step += r[e].step;
              _results[e].optimalAction += r[e].optimalAction;
            }
          }

          for (var e = 0; e < _.size(_results); e++) {
            _results[e].step /= nTimes;
            _results[e].optimalAction /= nTimes;
            _results[e].optimalActionPercentage = parseFloat((_results[e].optimalAction / _results[e].step * 100).toFixed(2))
          }


          // average the results
          cb(_results);
        });
    };
    var updateGraph = function () {
      self.salGraphOptimalActions.series.push({
        name: '#' + (self.salGraphOptimalActions.series.length + 1),
        data: _.pluck(_.last(self.trials).result, 'optimalActionPercentage')
      });

      self.salGraphAverageSteps.series.push({
        name: '#' + (self.salGraphAverageSteps.series.length + 1),
        data: _.pluck(_.last(self.trials).result, 'step')
      });
    };

    // data = { labels: [], datasets:[ {data:[]} ]}
    this.salGraphOptimalActions = {
      options: {
        chart: {
          type: 'line',
          zoomType: 'x'
        }
      },
      series: [],
      title: {
        text: 'Performance Metric (optimal actions)'
      },
      xAxis: {currentMin: 0, currentMax: 100, minRange: 5}
    };

    this.salGraphAverageSteps = {
      options: {
        chart: {
          type: 'line',
          zoomType: 'x'
        }
      },
      series: [],
      title: {
        text: 'Performance Metric (step until terminal)'
      },
      xAxis: {currentMin: 0, currentMax: 100, minRange: 5}
    }
  });
