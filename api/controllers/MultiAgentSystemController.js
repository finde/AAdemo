/**
 * MultiAgentSystemController
 *
 * @description :: Server-side logic for managing MultiAgentSystem
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var mas = require('../lib/multi_agent_system');

module.exports = {
  index: function (req, res) {

    return res.json({
      status: 'ok'
    });

    var config = req.param('config') || {};
    console.log(req.param('config'));

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

    return res.json(rPolicy.getAllAgents());
  }
};

