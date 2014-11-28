/**
 * SingleAgentLearningController
 *
 * @description :: Server-side logic for managing singleagentlearnings
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var singleAgentLearning = require('../lib/single_agent_learning');
module.exports = {
  inferring: function (req, res) {
    var config = req.param('config') || {};
    console.log(req.param('config'))

    config.nLearning = config.nLearning || 100;
    config.alpha = config.alpha || 0.1;
    config.gamma = config.gamma || 0.1;
    config.actionSelector = config.actionSelector || 'softmax';
    config.epsilon = config.epsilon || 0.1;
    config.initQ = config.initQ || 15;
    config.algorithm = config.algorithm || 'qlearning';

    // TODO:: find inferring
    var infer = {};
    for (var propertyName in config) {
      if (config.hasOwnProperty(propertyName)) {

        // if contain ',' then it is an infer
        console.log(propertyName, config[propertyName]);
        if (parseFloat(config[propertyName])) {
          continue;
        }

        var _split = _.clone(config[propertyName]).split(',');
        if (_.size(_split) > 0) {
          infer = {
            name: propertyName,
            values: _.map(_split, function (s) {
              if (parseFloat(s)) {
                return parseFloat(s);
              } else {
                return s.trim();
              }
            })
          };
        }

      }
    }

    if (_.size(infer.values) === 0) {
      infer = {
        name: 'algorithm',
        values: [config.algorithm]
      }
    }

    var averagingFactor = 5;
    async.auto(_.map(infer.values, function (v) {
        return function (callback) {
          var _config = _.clone(config);
          _config[infer.name] = v;

          Helpers.averagingFunction(averagingFactor, singleAgentLearning[_config.algorithm], _config, callback);
        }
      }), function (err, results) {
        // summarize the respond

        var graphData = {
          optimalActionPercentage: {
            series: []
          },
          averageSteps: {
            series: []
          }
        };

        for (var r = 0; r < _.size(results); r++) {
          graphData.optimalActionPercentage.series.push({
            name: [infer.name, infer.values[r]].join('='),
            data: _.pluck(results[r].result, 'optimalActionPercentage')
          });

          graphData.averageSteps.series.push({
            name: [infer.name, infer.values[r]].join('='),
            data: _.pluck(results[r].result, 'step')
          });
        }

        return res.json(graphData);
      }
    )
    ;


  }
};

