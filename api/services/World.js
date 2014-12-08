module.exports = function () {
  this.size = 4; // Default size
  this.maxReward = 10;

  this.setSize = function (sz) {
    this.size = sz ? 1 * sz : 0;
  };

  this.isLogEnabled = true;
  this.log = [];

  var world = this;

  this.steps = 0;

  this.predatorActions = [
    { index: 0, action: 'stay', transition: { x: 0, y: 0 }, probability: 0.2 },
    { index: 1, action: 'left', transition: { x: -1, y: 0 }, probability: 0.2 },
    { index: 2, action: 'right', transition: { x: 1, y: 0 }, probability: 0.2 },
    { index: 3, action: 'up', transition: { x: 0, y: -1 }, probability: 0.2 },
    { index: 4, action: 'down', transition: { x: 0, y: 1 }, probability: 0.2 }
  ];

  this.preyActions = [
    { index: 0, action: 'stay', transition: { x: 0, y: 0 }, probability: 0.8 },
    { index: 1, action: 'left', transition: { x: -1, y: 0 }, probability: 0.05 },
    { index: 2, action: 'right', transition: { x: 1, y: 0 }, probability: 0.05 },
    { index: 3, action: 'up', transition: { x: 0, y: -1 }, probability: 0.05 },
    { index: 4, action: 'down', transition: { x: 0, y: 1 }, probability: 0.05 }
  ];

  this.$get = function () {
    this.grid = [];
    this.predators = [];
    this.preys = [];

    this.getSize = function () {
      return world.size;
    };

    this.getSteps = function () {
      return world.steps;
    };

    this.getPredatorActions = function () {
      return world.predatorActions;
    };

    this.getPreyActions = function () {
      return world.preyActions;
    };

    // Build game board
    this.buildEmptyGameBoard = function () {
      this.grid = [];
      this.predators = [];
      this.preys = [];
      this.steps = 0;
      this.log = [];

      // Initialize our grid
      for (var x = 0; x < world.size * world.size; x++) {
        this.grid[x] = {
          action: null
        };
      }
    };

    this.giveFeedback = function (initState, action, options) {

      var finalState = {
        x: initState.x + action.transition.x,
        y: initState.y + action.transition.y
      };

      // toroidal
      if (finalState.x < 0) {
        finalState.x = world.size - 1;
      }

      if (finalState.x >= world.size) {
        finalState.x = 0;
      }

      if (finalState.y < 0) {
        finalState.y = world.size - 1;
      }

      if (finalState.y >= world.size) {
        finalState.y = 0;
      }

      // check suicide action (if forbiddenState exists)
      if (options && options.forbiddenState) {
        for (var i = 0; i < options.forbiddenState.length; i++) {
          if (isSamePositions(finalState, options.forbiddenState[i])) {
            return false;
          }
        }
      }

      return {
        state: finalState,
        reward: rewardFunction(finalState)
      }
    };

    var rewardFunction = function (predatorState) {
      for (var i = 0; i < world.preys.length; i++) {
        if (isSamePositions(predatorState, world.preys[i].state)) {
          return world.maxReward;
        }
      }

      return 0;
    };

    var isSamePositions = function (a, b) {
      return a.x === b.x && a.y === b.y;
    };

    this.isSamePosition = isSamePositions;

    this.spawnPredator = function (state, action, failFactor) {
      var _predator = new Agent(world, {
        state: state,
        actions: action || this.predatorActions,
        failFactor: failFactor || 0
      });

      this.predators.push(_predator);
    };

    this.spawnPrey = function (state, action, failFactor) {
      var _prey = new Agent(world, {
        state: state,
        actions: action || this.preyActions,
        failFactor: failFactor || 0
      });

      this.preys.push(_prey);
    };

    var storeWorldState = function () {
      var currentState = {
        step: world.steps,
        predators: _.map(world.predators, function (a) { return { state: a.state }; }),
        preys: _.map(world.preys, function (a) { return { state: a.state }; })
      };

      world.log.push(_.clone(currentState));
    };

    this.runSimulation = function (callback) {

      // step function
      var stepOnce = function () {
        world.steps++; // 0 based
        storeWorldState();

        if (!!world.isLogEnabled) {
          console.log('===== step ===== ', world.steps);
        }

        var _predator, _prey, _reward;

        for (var i = 0; i < world.predators.length; i++) {
          _predator = world.predators[i];

          _reward = _predator.takeAction();
          if (!!world.isLogEnabled) {
            console.log('predator >>', _predator.state);
          }

          if (_reward == world.maxReward) {
            return true;
          }
        }

        for (var j = 0; j < world.preys.length; j++) {
          // map forbidden state which is the predator(s) state
          var _forbiddenState = _.map(world.predators, function (pred) { return pred.state;});
          _prey = world.preys[j];
          _prey.takeAction({forbiddenState: _forbiddenState});

          if (!!world.isLogEnabled) {
            console.log('prey >>', _prey.state);
          }
        }

        return false
      };

      do {

        // do something before step (e.g. debug print)

      } while (!stepOnce());

      storeWorldState();

      if (callback && typeof callback == 'function') {
        return callback(!!world.isLogEnabled ? world.log : world.steps);
      }

      return !!world.isLogEnabled ? world.log : world.steps;
    };

    this.showPolicy = function (planningObj, targetLoc) {
      _.each(world.grid, function (g, index) {

        var y = Math.floor(index / world.size);
        var x = Math.floor(index - world.size * y);

        var idLoc = encodeRelativeDistance(targetLoc, {x: x, y: y}, world.size);

        // if policy evaluation
        if (!!planningObj.valueGrid) {

          if (planningObj.valueGrid[idLoc]) {
            var precision = 1e3;
            var val = Math.round(planningObj.valueGrid[idLoc].value * precision);
            g.value = val / precision;
          }

        } else {
          // if policy / value iteration
          g.value = null;

          // find the encodeID of current grid
          if (planningObj.policy[idLoc]) {
            g.action = planningObj.policy[idLoc].action;
            g.policy = planningObj.policy[idLoc];
          }

          if (planningObj.stateSpace[idLoc]) {
            g.stateSpace = planningObj.stateSpace[idLoc];
          }
        }

      });
    };

    /////
    // special for MAS
    /////
    this.MASstep = function (callback) {

      // check terminal
      var isTerminal = function (isDetail) {
        var isCatch = false;
        var isBump = false;

        // -- prey collide with predator
        _.each(world.preys, function (prey) {
          _.each(world.predators, function (predator) {
            if (isSamePositions(prey.state, predator.state)) {
              isCatch = true;
            }
          });
        });

        // -- predator collide with other predator
        _.each(world.predators, function (predator1, index1) {
          _.each(world.predators, function (predator2, index2) {
            if (index1 !== index2 && isSamePositions(predator1.state, predator2.state)) {
              isBump = true;
            }
          });
        });

        if (isDetail) {
          return {
            isCatch: isCatch,
            isBump: isBump
          }
        }

        return !!isCatch || !!isBump;
      };

      console.log(isTerminal(true))
      if (!isTerminal()) {
        // move predator
        _.each(world.predators, function (predator) {
          predator.takeActionMAS();
        });

        // move prey
        _.each(world.preys, function (prey) {
          prey.takeActionMAS();
        });
      }

      return callback(isTerminal());
    };

    return this;
  };

  return world.$get();
};