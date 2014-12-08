module.exports = function (opt) {
  // init constructor
  opt = opt || {};

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

  opt.initExplore = opt.initExplore || 
  {
    predator: 0.5,
    prey: 0.5
  };
  
  opt.decay = opt.decay || 
  {
    predator: 0.5,
    prey: 0.5
  };
  
  opt.gamma = opt.gamma ||
  {
    predator: 0.8,
    prey: 0.8
  }
  
  opt.initAlpha = opt.initAlpha ||
  {
    predator: 1,
    prey: 1
  }

  if (!opt.epsilon) {
    opt.epsilon = 0.1;
  }

  if (!opt.nLearning) {
    opt.nLearning = 2;
  }

  if (!opt.actionSelector) {
    opt.actionSelector = 'softmax';
  }

  if (!opt.initQ) {
    opt.initQ = 1;
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
      if (Math.random() < 0.8) {
        x = _currentState.x + action.transition.x;
        y = _currentState.y + action.transition.y;
      }
      else {
        x = _currentState.x;
        y = _currentState.y;
      }
    } else { // predator
      x = _currentState.x - action.transition.x;
      y = _currentState.y - action.transition.y;
    }

    return [ toroidalConvertion(x, worldSize / 2, worldSize), toroidalConvertion(y, worldSize / 2, worldSize)].join('_');
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
            preyAction.value = 0;
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
            predatorAction.value = 0;
          }
          preyAction.aVals.push(_.clone(predatorAction));
        });
        state.aVals.push(_.clone(preyAction));
      });

    });
  }
  
  // for each episode - until n times
  var predatorAction, preyAction, s, sPrey, sPredator, sPrime, preyReward, predatorReward, explore, alpha;
  for (var episode = 0; episode < opt.nLearning; episode++) {
    var optimalAction = 0;
    
    // Init s
    s = encodeRelativeDistance({x: 0, y: 0}, {x: 5, y: 5}, worldSize);

    alpha = opt.initAlpha;
    explore = opt.initExplore;
    
    // repeat until terminal or innerReach
    var innerLoopStep = 0;
    do {
      console.log('step:', innerLoopStep);
      // choose a from s using policy derived from Q (e.e e-greedy)
      
      //pick the predator action
      if (Math.random() < explore.predator) {
        //take a random action
        predatorAction = predatorActions[Math.floor(Math.random()*5)]
        console.log('pred random:', predatorAction.action);
        
      } else {
        //take an action according to pi[s,a]
        opt.predatorStateSpace
        aVals = opt.predatorStateSpace[s].aVals;
        var weighted_list = generateWeightedList(_.pluck(aVals, 'pi'));
        predatorAction = predatorActions[Math.floor(Math.random(0, weighted_list.length - 1))];
        console.log('pred planned:', predatorAction.action);
      }
      sPredator = transition(s, 'predator', predatorAction, worldSize);
      console.log('sPredator:', sPredator);
      
      //pick the prey action
      if (Math.random() < explore.prey) {
        //take a random action
        preyAction = preyActions[Math.floor(Math.random()*5)]
        console.log('prey random:', predatorAction.action);

      } else {
        //take an action according to pi[s,a]
        aVals = opt.preyStateSpace[s].aVals;
        var weighted_list = generateWeightedList(_.pluck(aVals, 'pi'));
        preyAction = preyActions[Math.floor(Math.random(0, weighted_list.length - 1))]
        console.log('prey planned:', preyAction.action);
      }
      sPrime = transition(sPredator, 'prey', preyAction, worldSize);
      console.log('sPrime:', sPrime);
      
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
      var newQ = (1.0 - alpha.prey) * oldQ + alpha.prey * (predatorReward + opt.gamma * opt.preyStateSpace[sPrime].value);
      opt.preyStateSpace[s].aVals[preyAI].aVals[predatorAI].value = newQ;
      
      // update predator Q
      oldQ = opt.predatorStateSpace[s].aVals[predatorAI].aVals[preyAI].value; 
      newQ = (1.0 - alpha.predator) * oldQ + alpha.predator * (predatorReward + opt.gamma * opt.preyStateSpace[sPrime].value);
      opt.predatorStateSpace[s].aVals[predatorAI].aVals[preyAI].value = newQ;      
      
      // do linear programming
      // ...
      
      //update V[s]
       
      
      // update alpha
      alpha.predator = alpha.predator * opt.decay.predator;
      alpha.prey = alpha.prey * opt.decay.prey;
      
      // update s <- s'
      s = sPrime;

      innerLoopStep++;
      
      //todo: decay alpha
      //todo: decay explore
    } while (s !== '0_0' && innerLoopStep < 10000);
    // we limit it to 10k to prevent the apps freeze
}

}
