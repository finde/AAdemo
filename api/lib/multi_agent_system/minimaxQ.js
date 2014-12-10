module.exports = function (opt) {
  // init constructor
  opt = opt || {};
  
  var numbers = require('numbers');
  var lpsolve = require('lp_solve');

  opt.worldSize = opt.worldSize || 11;

  var world = new World();
  world.setSize(opt.worldSize);
  world.isLogEnabled = false;

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

  var numbers = require('numbers');

  console.log('start #' + opt.id);

  opt.results = [];

  // properties
  var world = new World();
  world.setSize(11);
  world.isLogEnabled = false;

  var worldSize = world.getSize();
  
  var stepLimit = 100000;

  opt.initExplore = opt.initExplore || 
  {
    predator: 1,
    prey: 1
  };
  
  opt.decay = opt.decay || 
  {
    predator: 1,
    prey: 1
  };
  
  opt.gamma = opt.gamma ||
  {
    predator: 0.6,
    prey: 0.6
  }
  
  opt.initAlpha = opt.initAlpha ||
  {
    predator: 0.5,
    prey: 0.5
  }

  if (!opt.epsilon) {
    opt.epsilon = 0.1;
  }

  if (!opt.nLearning) {
    opt.nLearning = 10000;
  }

  if (!opt.actionSelector) {
    opt.actionSelector = 'softmax';
  }

  if (!opt.initQ) {
    opt.initQ = 1;
  }

  if (!opt.maxDelta) {
    opt.maxDelta = 0.0035;
  }

  var predatorActions = world.getPredatorActions();
  var preyActions = world.getPreyActions();
  
  // new transition function with trip chance = 0.2
  var transition = function (currentState, actor, action, worldSize) {
    var x, y;
    var _currentState = _.clone(currentState);

    if (typeof _currentState == 'string') {
      _currentState = {
        x: _currentState.split('_')[0] * 1.0,
        y: _currentState.split('_')[1] * 1.0
      };
    }

    if (actor === 'prey') {
      // prey trip chance = 0.2
      if (Math.random() < 0.8) {
        x = _currentState.x + action.transition.x;
        y = _currentState.y + action.transition.y;
      }
      else {
        //console.log('TRIP!');
        x = _currentState.x;
        y = _currentState.y;
      }
    } else { // predator
      x = _currentState.x - action.transition.x;
      y = _currentState.y - action.transition.y;
    }

    return [ toroidalConvertion(x, worldSize / 2, worldSize), toroidalConvertion(y, worldSize / 2, worldSize)].join('_');
  };
  
  var actionSelection = function (actionSelector, opt) {
    var softmaxActionSelection = function (currentStateIndex, stateSpace) {

      var actionValues = _.pluck(stateSpace[currentStateIndex].aVals, 'pi');

      var expValues = [];
      _.each(actionValues, function (actionValue) {
        expValues.push(Math.exp(actionValue));
      });

      var randomValue = Math.random() * numbers.basic.sum(expValues);

      for (var i = 0; i < _.size(actionValues); i++) {
        if (randomValue <= expValues[i]) {
          return stateSpace[currentStateIndex].aVals[i];
        } else {
          randomValue -= expValues[i];
        }
      }

      // to ensure it return something
      return _.first(stateSpace[currentStateIndex].actionValues);
    };

    var greedyActionSelections = function (epsilon, currentStateIndex, stateSpace) {
      var random = Math.random();

      var world = new World();
      world.setSize(11);
      world.isLogEnabled = false;
      var predatorActions = world.getPredatorActions();

      var action; // action Object
      if (random < epsilon) {
        // choose random action
        action = stateSpace[currentStateIndex].actionValues[rand(0, _.size(predatorActions) - 1)];
      } else {
        var actionValues = _.pluck(stateSpace[currentStateIndex].aVals, 'pi');
        var maxValue = numbers.basic.max(actionValues);

        for (var i = 0; i < actionValues.length; i++) {
          // if multiple actions have maxValue, use the first one
          if (actionValues[i] == maxValue) {
            action = stateSpace[currentStateIndex].aVals[i];
            break;
          }
        }
      }

      return action;
    };

    switch (actionSelector) {
      case 'greedy':
        return greedyActionSelections(opt.epsilon, opt.currentStateIndex, opt.stateSpace);

      case 'softmax':
        return softmaxActionSelection(opt.currentStateIndex, opt.stateSpace);
    }
  };
  
  var probability = function (actionSelector, opt) {

    var softmaxActionProbability = function (currentStateIndex, currentAction, stateSpace) {
      var actionValues = _.pluck(this.stateSpace[currentStateIndex].aVals, 'pi');

      var expValues = [];
      _.each(actionValues, function (actionValue) {
        expValues.push(Math.exp(actionValue));
      });

      return Math.exp(currentAction.value) / numbers.basic.sum(expValues);
    }

    var greedyActionProbability = function (epsilon, currentStateIndex, currentAction, stateSpace) {

      var action; // action Object
      // choose argmax q(s,a)
      var actionValues = _.pluck(this.stateSpace[currentStateIndex].aVals, 'pi');
      var maxValue = numbers.basic.max(actionValues);

      for (var i = 0; i < actionValues.length; i++) {
        if (actionValues[i] == maxValue) {
          action = this.stateSpace[currentStateIndex].aVals[i];
          break;
        }
      }

      if (currentAction === action) {
        return 1 - epsilon + epsilon / _.size(predatorActions);
      } else {
        return epsilon / _.size(predatorActions);
      }
    };

    switch (actionSelector) {
      case 'greedy':
        return greedyActionProbability(opt.epsilon, opt.currentStateIndex, opt.currentAction, opt.stateSpace);

      case 'softmax':
        return softmaxActionProbability(opt.currentStateIndex, opt.currentAction, opt.stateSpace);
    }
  };
  
  var solvelp = function (stateSpace, state) {
    var Row = lpsolve.Row;
    var lp = new lpsolve.LinearProgram();
    lp.setVerbose(3);
    
    var policy = [];
    var c = lp.addColumn('c');
    var objective = new Row().Add(c, 1);
    
    //create columns
    for (var i = 0; i<5; i++) {
      policy.push(lp.addColumn('a' + i));
    }
    lp.setObjective(objective, false);
    var constraints = [];
    
    for (i=0; i<5; i++) {
      constraints[i] = new Row().Add(c, 1);
      for (j=0; j<5; j++) {
        constraints[i].Add(policy[j], Math.min(-0.001, -1.0 * (stateSpace[state].aVals[j].aVals[i].value).toFixed(4)));
      }
      lp.addConstraint(constraints[i], 'LE',0, 'constraint');
    }
    
    var probDistr = new Row();
    for (var i=0; i<5; i++) {
      probDistr.Add(policy[i], 1);
    }
    lp.addConstraint(probDistr, 'EQ', 1, 'probdistri');

    for (var i=0; i<5; i++) {
      lp.addConstraint(new Row().Add(policy[i], 1), 'GE', 0, 'nonegative');
    }
    lp.addConstraint(new Row().Add(c, 1), 'GE', 0, 'nonegative'); //might not be required
    
    //console.log(lp.dumpProgram());
    var string = [];
    var res = lp.solve();
    if (res.code === 2) {
      console.log(opt);
      console.log(lp.dumpProgram());
      console.log(state);
      lp.setVerbese(4);
      lp.solve();
      return -1;
    }
    
    var results = [];
    //console.log('objective =', lp.getObjectiveValue())
    //console.log('probability distribution value =', lp.calculate(probDistr));
    for (var i =0; i<5; i++) {
      results.push((lp.get(policy[i])).toFixed(8) * 1.0);
      string += preyActions[i].action +' '+ results[i] + ' ';
      
    }
    //console.log(string);
    
    delete lp
    return results;
  };

  // Algorithm
  // - init Q(s,a) = 15
  if (!opt.predatorStateSpace) {
    opt.predatorStateSpace = new OptimizedStateSpace(worldSize, 0);
    _.each(opt.predatorStateSpace, function (state) {
      
      state.value = 1;

      state.aVals = [];

      // if state is not terminal, set value to 15
      _.each(predatorActions, function (predatorAction) {
        predatorAction.pi = 1.0/5;
        predatorAction.aVals = [];
        
        _.each(preyActions, function (preyAction) {
          if (state.id !== '0_0') {
            preyAction.value = opt.initQ;
          } else {
            preyAction.value = opt.initQ;
          }
          predatorAction.aVals.push(_.clone(preyAction));
        });
        state.aVals.push(_.clone(predatorAction));
      });
    });
  }
  
    // - init Q(s,a) = 15
  if (!opt.preyStateSpace) {
    opt.preyStateSpace = new OptimizedStateSpace(worldSize, 0);
    _.each(opt.preyStateSpace, function (state) {
      
      state.value = 1;

      state.aVals = [];

      // if state is not terminal, set value to 15
      _.each(preyActions, function (preyAction) {
        preyAction.pi = 1.0/5;
        preyAction.aVals = [];
        
        _.each(predatorActions, function (predatorAction) {
          if (state.id !== '0_0') {
            predatorAction.value = opt.initQ;
          } else {
            predatorAction.value = opt.initQ;
          }
          preyAction.aVals.push(_.clone(predatorAction));
        });
        state.aVals.push(_.clone(preyAction));
      });

    });
  }
  
  // for each episode - until n times
  var predatorAction, preyAction, s, sPrey, sPredator, sPrime, preyReward;
  var predatorReward, explore, alpha, newVs;
  var delta = 10000;
  var olist;
  explore = _.clone(opt.initExplore);
  for (var episode = 0; episode < opt.nLearning && delta >= opt.maxDelta; episode++) {
    var optimalAction = 0;
    delta = 0;
    
    // Init s
    s = encodeRelativeDistance({x: 0, y: 0}, {x: 5, y: 5}, worldSize);

    alpha = opt.initAlpha;
    
    // repeat until terminal or stepLimit
    var innerLoopStep = 0;
    do {
      var debugString = [];
      console.log('\n\t\t\t\t\t\t\t\t\tepisode:', episode, '/', opt.nLearning);
      console.log('\t\t\t\t\t\t\t\t\t\tstep:', innerLoopStep);
      // choose a from s using policy derived from Q (e.e e-greedy)
      
      debugString += 's:'+ s;
      //pick the predator action
      if (Math.random() < explore.predator) {
        //take a random action
        predatorAction = predatorActions[Math.floor(Math.random()*5)]
        debugString += ' pred random:'+ predatorAction.action;
        
      } else {
        //take an action according to pi[s,a]
        predatorAction = actionSelection(opt.actionSelector, {
          epsilon: opt.epsilon,
          currentStateIndex: s,
          stateSpace: opt.predatorStateSpace
        });
        debugString += ' pred planned:'+ predatorAction.action;
      }
      
      //pick the prey action
      if (Math.random() < explore.prey) {
        //take a random action
        preyAction = preyActions[Math.floor(Math.random()*5)]
        debugString += ' prey random: '+ predatorAction.action;

      } else {
        //take an action according to pi[s,a]
        //aVals = opt.preyStateSpace[s].aVals;
        //var weighted_list = generateWeightedList(_.pluck(aVals, 'pi'));
        //preyAction = preyActions[Math.floor(Math.random(0, weighted_list.length - 1))]
        preyAction = actionSelection(opt.actionSelector, {
          epsilon: opt.epsilon,
          currentStateIndex: s,
          stateSpace: opt.preyStateSpace
        });
        debugString += ' prey planned: '+ preyAction.action;
      }
      
      //execute actions
      sPredator = transition(s, 'predator', predatorAction, worldSize);
      debugString += ' sPredator:'+ sPredator;
      sPrime = transition(sPredator, 'prey', preyAction, worldSize);
      debugString += ' sPrime: '+ sPrime;
      //console.log(debugString);
      //console.log(explore.predator, explore.prey);
      
      //calculate rewards      
      preyReward = 0;
      predatorReward = 0;
      if (sPrime === '0_0') {
        predatorReward = world.maxReward;
        preyReward = -1*world.maxReward;
      } 

      // update q(s,a,o) 
      var preyAI = preyAction.index;
      var predatorAI = predatorAction.index;
      // update prey Q
      var oldQ = opt.preyStateSpace[s].aVals[preyAI].aVals[predatorAI].value; 
      var newQ = (1.0 - alpha.prey) * oldQ + alpha.prey * (preyReward + opt.gamma.prey * opt.preyStateSpace[sPrime].value);
      opt.preyStateSpace[s].aVals[preyAI].aVals[predatorAI].value = _.clone(newQ);
      // update predator Q
      oldQ = opt.predatorStateSpace[s].aVals[predatorAI].aVals[preyAI].value; 
      newQ = (1.0 - alpha.predator) * oldQ + alpha.predator * (predatorReward + opt.gamma.predator * opt.predatorStateSpace[sPrime].value);
      opt.predatorStateSpace[s].aVals[predatorAI].aVals[preyAI].value = _.clone(newQ);
      
      // do linear programming
      var predatorPolicy = solvelp(opt.predatorStateSpace, s);
      var preyPolicy = solvelp(opt.preyStateSpace, s);
      for (var i=0; i<preyAction.length; i++) {
        opt.predatorStateSpace[s].aVals[i].pi = predatorPolicy[i];
        opt.preyStateSpace[s].aVals[i].pi = preyPolicy[i];
      }
      
      // update predator V[s]
      oList = [];
      for (var i=0; i<predatorActions.length; i++) {
        var partialSum = 0;
        for (var j=0; j<preyActions.length; j++) {
          partialSum += opt.predatorStateSpace[s].aVals[i].pi * opt.predatorStateSpace[s].aVals[i].aVals[j].value;
        }
        oList.push(partialSum);
      }
      newVs = Math.min(oList[0], oList[1], oList[2], oList[3], oList[4]);
      delta = Math.max(delta, Math.abs(newVs - opt.predatorStateSpace[s].value));
      opt.predatorStateSpace[s].value = newVs;
      
      // update prey V[s]
      oList = [];
      for (var i=0; i<preyActions.length; i++) {
        partialSum = 0;
        for (var j=0; j<predatorActions.length; j++) {
          partialSum += opt.preyStateSpace[s].aVals[i].pi * opt.preyStateSpace[s].aVals[i].aVals[j].value;
        }
        oList.push(partialSum);
      }
      newVs = Math.min(oList[0], oList[1], oList[2], oList[3], oList[4]);
      delta = Math.max(delta, Math.abs(newVs - opt.preyStateSpace[s].value));
      opt.preyStateSpace[s].value = newVs;
      console.log(delta);
      
      // update alpha
      alpha.predator = alpha.predator * opt.decay.predator;
      alpha.prey = alpha.prey * opt.decay.prey;
      
      // update s <- s'
      s = sPrime;

      innerLoopStep++;
      
      //todo: decay explore
    } while (s !== '0_0' && innerLoopStep < stepLimit);
    if (innerLoopStep >= stepLimit) {
      opt.results.push(innerLoopStep);
      console.log(opt.results);
      console.log('stepLimit reached.');
      return -1;
    }
    
    // when commentend, explore is constant to initExplore
    explore.predator = explore.predator * 0.95;
    explore.prey = explore.prey * 0.95;
    
    // we limit it to 10k to prevent the apps freeze
    console.log(innerLoopStep);
    opt.results.push(innerLoopStep);
  }
  opt.predatorStateSpace = null;
  opt.preyStateSpace = null;
  console.log(opt);
  console.log(delta, opt.maxDelta);
  console.log(' ');
  console.log(' ');
  console.log(' ');
}
