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
    predator: 0.9,
    prey: 0.9
  };
  
  opt.gamma = opt.gamma ||
  {
    predator: 0.9,
    prey: 0.9
  }
  
  opt.initAlpha = opt.initAlpha ||
  {
    predator: 1,
    prey: 1
  }

  if (!opt.verbose) {
    opt.verbose = false;
  }

  if (!opt.nLearning) {
    opt.nLearning = 1000;
  }

  if (!opt.initQ) {
    opt.initQ = 1;
  }

  if (!opt.maxDelta) {
    opt.maxDelta = 0.001;
  }
  
  console.log(opt);

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
  
  var probability = function (aVals, actorActions) {
    var weighted_list = generateWeightedList(_.pluck(aVals, 'pi'));
    return actorActions[Math.floor(Math.random(0, weighted_list.length - 1))]
  };
  
  var solvelp = function (stateSpace, state) {
    var Row = lpsolve.Row;
    var lp = new lpsolve.LinearProgram();
    lp.setVerbose(opt.verbose ? 4 : 3);
    
    var policy = [];
    var c = lp.addColumn('c');
    var objective = new Row().Add(c, 1);
    lp.setUnbounded('c');
    
    //create columns
    for (var i = 0; i<5; i++) {
      policy.push(lp.addColumn('a' + i));
    }
    lp.setObjective(objective, false);
    var constraints = [];
    
    for (i=0; i<5; i++) {
      constraints[i] = new Row().Add(c, 1);
      for (j=0; j<5; j++) {
        constraints[i].Add(policy[j], -1.0 * (stateSpace[state].aVals[j].aVals[i].value).toFixed(4));
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
    
    //console.log(lp.dumpProgram());
    var string = [];
    var res = lp.solve();
    if (res.code === 2) {
      console.log(opt);
      console.log(lp.dumpProgram());
      console.log(state);
      lp.setVerbose(4);
      lp.solve();
      return -1;
    }
    
//    var objValue = lp.getObjectiveValue();
//    if (objValue < 0) {
//      console.log(opt);
//      console.log(lp.dumpProgram());
//      console.log('objValue:', objValue);
//      console.log(state);
//      lp.setVerbose(4);
//      lp.solve();
//      return -1;
//    }
    
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
  var delta;
  var olist;
  explore = _.clone(opt.initExplore);
  
  var isConverged = function (delta) {
    return typeof delta !== 'undefined' && delta < 20*opt.maxDelta;
  };
  
  for (var episode = 0; episode < opt.nLearning && !isConverged(sumDelta); episode++) {
    var optimalAction = 0;
    delta = 0;
    
    // Init s
    s = encodeRelativeDistance({x: 0, y: 0}, {x: 5, y: 5}, worldSize);

    alpha = opt.initAlpha;
    
    // repeat until terminal or stepLimit
    var innerLoopStep = 0;
    do {
      var debugString = [];
      // choose a from s using policy derived from Q (e.e e-greedy)
      
      debugString += 's:'+ s;
      //pick the predator action
      if (Math.random() < explore.predator) {
        //take a random action
        predatorAction = predatorActions[Math.floor(Math.random()*5)]
        //debugString += ' pred random:'+ predatorAction.action;
        
      } else {
        //take an action according to pi[s,a]
        preyAction = probability(opt.preyStateSpace[s].aVals, preyActions);

        // alternatively we can use 'softmax' or 'greedy' by uncomment code below
        // preyAction = actionSelection(opt.actionSelector, {
        //  epsilon: opt.epsilon,
        //  currentStateIndex: s,
        //  stateSpace: opt.preyStateSpace
        //});
      }
      
      //pick the prey action
      if (Math.random() < explore.prey) {
        //take a random action
        preyAction = preyActions[Math.floor(Math.random()*5)]
        debugString += ' prey random: '+ predatorAction.action;

      } else {
        //take an action according to pi[s,a]
        predatorAction = probability(opt.predatorStateSpace[s].aVals, predatorActions);

        // alternatively we can use 'softmax' or 'greedy' by uncomment code below
        // predatorAction = actionSelection(opt.actionSelector, {
        //  epsilon: opt.epsilon,
        //  currentStateIndex: s,
        //  stateSpace: opt.predatorStateSpace
        // });
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
      if (preyPolicy === -1 || predatorPolicy === -1)
        return -1;
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
      
      // update s <- s'
      s = sPrime;

      innerLoopStep++;
      
    } while (s !== '0_0' && innerLoopStep < stepLimit);
    
    if (innerLoopStep >= stepLimit) {
      console.log(opt);
      opt.results.push(innerLoopStep);
      console.log('stepLimit reached.');
      return -1;
    }
    
    // update alpha
    alpha.predator = alpha.predator * opt.decay.predator;
    alpha.prey = alpha.prey * opt.decay.prey;
    
    // when commentend, explore is constant to initExplore
    explore.predator = explore.predator * 0.95;
    explore.prey = explore.prey * 0.95;
    
    opt.results.push({innerLoopStep: innerLoopStep, delta: delta});
    if (opt.results.length > 20) {
      var sumDelta = 0;
      for (var i=opt.results.length-1; i>=opt.results.length - 20; i--) {
        sumDelta += opt.results[i].delta;
      }
    }
    
    console.log('episode:', episode+1, '/', opt.nLearning, '\tstep:', innerLoopStep, '\tsumDelta:', sumDelta / 20.0);
    
  }
  
  opt.predatorStateSpace = null;
  //opt.preyStateSpace = null;
  console.log(opt);
  console.log(delta, opt.maxDelta);
  console.log('\n\n\n');
}
