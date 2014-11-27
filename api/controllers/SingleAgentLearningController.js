/**
 * SingleAgentLearningController
 *
 * @description :: Server-side logic for managing singleagentlearnings
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var singleAgentLearning = require('../lib/single_agent_learning');
module.exports = {
  inferring: function (req, res) {
    var config = req.config || {};

    config.nLearning = config.nLearning || 1000;
    config.alpha = config.alpha || 0.1;
    config.gamma = config.gamma || 0.1;
    config.actionSelector = config.actionSelector || 'softmax';
    config.epsilon = config.epsilon || 0.1;
    config.initQ = config.initQ || 15;
    config.algorithm = config.algorithm || 'qlearning';

    Helpers.averagingFunction(50, singleAgentLearning[config.algorithm], config, function (err, results) {

      return res.json(results);

    });

  },
  sarsa: function (req, res) {
    return res.send("Hi there!");
  },
};

