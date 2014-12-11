module.exports = function (opt) {
  var numbers = require('numbers');
  var lpsolve = require('lp_solve');
  
  // init constructor
  opt = opt || {};
  opt.results = [];

  opt.worldSize = opt.worldSize || 11;
  var world = new World();
  world.setSize(opt.worldSize);
  world.isLogEnabled = false;
  worldSize = opt.worldSize;

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

  var predatorActions = world.getPredatorActions();
  var preyActions = world.getPreyActions();

  this.world = world;  
  console.log('start #' + opt.id);

  // properties
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
    opt.nLearning = 2000;
  }
  if (!opt.steplimit) {
    opt.steplimit = 10000;
  }
  if (!opt.initQ) {
    opt.initQ = 1;
  }
  if (!opt.maxDelta) {
    opt.maxDelta = 0.01;
  }
  
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
      if (Math.random() < 0.8) {										// prey trip chance = 0.2
        x = _currentState.x + action.transition.x;
        y = _currentState.y + action.transition.y;
      }
      else { 																				// the prey has tripped!
        x = _currentState.x;
        y = _currentState.y;
      }
    } else { 																				// predator
      x = _currentState.x - action.transition.x;
      y = _currentState.y - action.transition.y;
    }

    return [ toroidalConvertion(x, worldSize / 2, worldSize), toroidalConvertion(y, worldSize / 2, worldSize)].join('_');
  };
  
  // returns a random action i with probability aVals[i].pi
  var probability = function (aVals, actorActions) {
    var weighted_list = generateWeightedList(_.pluck(aVals, 'pi'));
    return actorActions[weighted_list[Math.floor(Math.random()*(weighted_list.length - 1))]];
  };
  
  // returns min{o', sum{a', pi[s,a'] * Q[s,a',o']}}
  var getMinV = function (stateSpace, state) {
  	var oList = [], partialSum;
	  for (var i=0; i<5; i++) {
	    partialSum = 0;
	    for (var j=0; j<5; j++) {
	      partialSum += stateSpace[state].aVals[i].pi * stateSpace[s].aVals[j].aVals[i].value;
	    }
	    oList.push(partialSum);
	  }
	  return Math.min(oList[0], oList[1], oList[2], oList[3], oList[4]);
  };
  
  // solves the linear program argmax{pi[s,.], min{o', sum{a', pi[s,a'] * Q[s,a',o']}}}
  var solvelp = function (stateSpace, state) {
    var results = [];
    var Row = lpsolve.Row;
    var lp = new lpsolve.LinearProgram();
    lp.setVerbose(opt.verbose? 4 : 1);
    
    var policy = [];
    var c = lp.addColumn('c');
    var objective = new Row().Add(c, 1);
    lp.setUnbounded('c');				// objective function needs to be a free variable
    
    //create columns
    for (var i = 0; i<5; i++) {
      policy.push(lp.addColumn('a' + i));
    }
    lp.setObjective(objective, false); // false because we want to maximize, not minimize
    
    var constraints = []; 			// array that holds most constraints
    var probDistr = new Row();	// constraint that forces pi to be a probability distribution
    for (var i=0; i<5; i++) {
      constraints[i] = new Row().Add(c, 1);
      probDistr.Add(policy[i], 1);
      for (var j=0; j<5; j++) {
        constraints[i].Add(policy[j], -1.0 * (stateSpace[state].aVals[j].aVals[i].value).toFixed(4));
      }
      lp.addConstraint(constraints[i], 'LE',0, 'constraint');
    }
    lp.addConstraint(probDistr, 'EQ', 1, 'probdistri');

    var res = lp.solve();
    if (res.code === 2) { 			// is this problem unfeasible?
      console.log(opt);
      console.log(lp.dumpProgram());
      console.log(state);
      lp.setVerbose(4);
      lp.solve();
      return -1;
    }
    
    // pushes the values of pi to results
    for (var i =0; i<5; i++) {
      results.push((lp.get(policy[i])).toFixed(8) * 1.0);
    }
    
    if (opt.verbose) {
      console.log(lp.dumpProgram());
	    console.log('objective =', lp.getObjectiveValue())
	    console.log('probability distribution value =', lp.calculate(probDistr));
	    for (var i=0; i<5; i++) {
	    	console.log(results[i]);
	    }
    }
    
    delete lp
    return results;
  };
  
  console.log(opt);  

  // Algorithm
  // initialize Q(s,a,o) for predator
  if (!opt.predatorStateSpace) {
    opt.predatorStateSpace = new OptimizedStateSpace(worldSize, 0);
    _.each(opt.predatorStateSpace, function (state) {
      state.value = 1; // as used by paper
      
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
  
  // initialize Q(s,a,o) for prey
  if (!opt.preyStateSpace) {
    opt.preyStateSpace = new OptimizedStateSpace(worldSize, 0);
    _.each(opt.preyStateSpace, function (state) {
      state.value = 1; // as used by paper
      
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
  
  // returns true if the past 20 delta is on average less than opt.maxDelta
  var isConverged = function (delta) {
    return typeof delta !== 'undefined' && delta < 20*opt.maxDelta;
  };

  var predatorAction, preyAction, s, sPrey, sPredator, sPrime, preyReward;
  var predatorReward, explore, alpha, newVs, innerLoopStep;
  var delta, preyAI, predatorAI, newQ, oldQ;
  
  // for each episode - until nLearning times or isConverged
  explore = _.clone(opt.initExplore);
  for (var episode = 0; episode < opt.nLearning && !isConverged(sumDelta); episode++) {
    // Initialize episode
    s = encodeRelativeDistance({x: 0, y: 0}, {x: 5, y: 5}, worldSize);
    alpha = opt.initAlpha;
    delta = 0;
    innerLoopStep = 0;
    
    // repeat until terminal or stepLimit has been reached
    do {
      //pick the predator action
      if (Math.random() < explore.predator) {
        //take a random action
        predatorAction = predatorActions[Math.floor(Math.random()*5)]
      } else {
        //take an action according to pi[s,a]
        predatorAction = probability(opt.predatorStateSpace[s].aVals, predatorActions);
      }
      
      //pick the prey action
      if (Math.random() < explore.prey) {
        //take a random action
        preyAction = preyActions[Math.floor(Math.random()*5)]
      } else {
        //take an action according to pi[s,a]
        preyAction = probability(opt.preyStateSpace[s].aVals, preyActions);
      }
      
      //execute actions
      sPredator = transition(s, 'predator', predatorAction, worldSize);
      sPrime = transition(sPredator, 'prey', preyAction, worldSize);
      
      //calculate rewards      
      preyReward = 0;
      predatorReward = 0;
      if (sPrime === '0_0') {
        predatorReward = world.maxReward;
        preyReward = -1*world.maxReward;
      } 
      
      // update q(s,a,o) 
      preyAI = preyAction.index;
      predatorAI = predatorAction.index;
      
      oldQ = opt.preyStateSpace[s].aVals[preyAI].aVals[predatorAI].value; 
      newQ = (1.0 - alpha.prey) * oldQ 
      newQ += alpha.prey * (preyReward + opt.gamma.prey * opt.preyStateSpace[sPrime].value);
      opt.preyStateSpace[s].aVals[preyAI].aVals[predatorAI].value = _.clone(newQ);
      
      oldQ = opt.predatorStateSpace[s].aVals[predatorAI].aVals[preyAI].value; 
      newQ = (1.0 - alpha.predator) * oldQ 
      newQ += alpha.predator * (predatorReward + opt.gamma.predator * opt.predatorStateSpace[sPrime].value);
      opt.predatorStateSpace[s].aVals[predatorAI].aVals[preyAI].value = _.clone(newQ);
      
      // do linear programming
      var predatorPolicy = solvelp(opt.predatorStateSpace, s);
      var preyPolicy = solvelp(opt.preyStateSpace, s);
      
      if (preyPolicy === -1 || predatorPolicy === -1) // if either LP's failed
        return -1;
      
      // update the policies pi[s,:]
      for (var i=0; i<5; i++) {
        opt.predatorStateSpace[s].aVals[i].pi = predatorPolicy[i];
        opt.preyStateSpace[s].aVals[i].pi = preyPolicy[i];
      }
      
      // update V[s] = min{o', sum{a', pi[s,a'] * Q[s,a',o']}}
      newVs = getMinV(opt.predatorStateSpace, s);
      delta = Math.max(delta, Math.abs(newVs - opt.predatorStateSpace[s].value));
      opt.predatorStateSpace[s].value = newVs;
      
      newVs = getMinV(opt.preyStateSpace, s);
      delta = Math.max(delta, Math.abs(newVs - opt.preyStateSpace[s].value));
      opt.preyStateSpace[s].value = newVs;
      
      // update s <- s'
      s = sPrime;
      innerLoopStep++;
    } while (s !== '0_0' && innerLoopStep < opt.steplimit); // end step loop
    
    if (innerLoopStep >= opt.steplimit) {
      console.log(opt);
      opt.results.push(innerLoopStep);
      console.log('stepLimit reached.');
      return -1;
    }
    
    // update alpha and explore
    alpha.predator 		= alpha.predator * opt.decay.predator;
    alpha.prey 				= alpha.prey * opt.decay.prey;
    explore.predator 	= explore.predator * 0.93;
    explore.prey 			= explore.prey * 0.93;
    
    opt.results.push({innerLoopStep: innerLoopStep, delta: delta});
    if (opt.results.length > 20) {
      var sumDelta = 0;
      for (var i=opt.results.length-1; i>=opt.results.length - 20; i--) {
        sumDelta += opt.results[i].delta;
      }
    }
    console.log('episode:', episode+1, '/', opt.nLearning, '\tstep:', innerLoopStep, '\tsumDelta:', sumDelta / 20.0);
  } // end episode loop
  
  var string = [];
  var state;
  string.push('0_1', '0_-1', '1_0', '-1_0');
  for (var i=0; i<string.length; i++) {
  	state = string[i];
    console.log(state);
    console.log(opt.preyStateSpace[state].aVals);
    solvelp(opt.predatorStateSpace, state);
    //console.log(state.aVals);
  }
  console.log(delta, opt.maxDelta);
  console.log('\n\n\n');
  
  console.log(opt.results);
}
