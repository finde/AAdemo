/**
 * MultiAgentSystemController
 *
 * @description :: Server-side logic for managing MultiAgentSystem
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var mas = require('../lib/multi_agent_system');

module.exports = {
  index: function (req, res) {

    var config = req.param('config') || {};
//    console.log(req.param('config'));

    var rPolicy = mas.randomPolicy({
      worldSize: 11,
      initPredator: [
        { x: 0, y: 0},
        { x: 10, y: 10},
        { x: 10, y: 0},
        { x: 0, y: 10}
      ],
      initPrey: [
        { x: 5, y: 5}
      ]
    });

    var getAgents = function () {
      return {
        predators: rPolicy.world.predators,
        preys: rPolicy.world.preys
      };
    };

    var masStep = function () {
      console.log(_.pluck(getAgents().predators, 'state'));
      console.log(_.pluck(getAgents().preys, 'state'));

      rPolicy.world.MASstep(function (isConverge) {
        if (!isConverge) {
          masStep();
        } else {

          console.log('=====converge=====');
          console.log(_.pluck(getAgents().predators, 'state'));
          console.log(_.pluck(getAgents().preys, 'state'));
          console.log('==================');
          console.log('==================');
          console.log('==================');

        }
      });
    };

    masStep();

//    _.each([1, 2, 3, 4, 5], function () {
//      console.log(_.pluck(getAgents().predators, 'state'));
//      console.log(_.pluck(getAgents().preys, 'state'));
//
//      if (rPolicy.world.MASstep()) {
//        console.log('====converge====')
//      }
//    });

//    async.auto(_.map([0, 1, 2, 3, 4], function () {
//      return function (cb) {
//        console.log(_.pluck(getAgents().predators, 'state'));
//        console.log(_.pluck(getAgents().preys, 'state'));
//
//        rPolicy.world.MASstep();
//      }
//    }), function (err, results) {
//      console.log(_.pluck(getAgents().predators, 'state'));
//      console.log(_.pluck(getAgents().preys, 'state'));
//
//    });


    return res.json({});
  },
  minimaxQ: function (req, res) {
    var mmQ = mas.minimaxQ();
    
    res.ok();
  }
};

