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
    console.log(req.param('config'));

    config.nLearning = req.param('nLearning') || config.nLearning || 100;
    config.alpha = req.param('alpha') || config.alpha || 0.1;
    config.gamma = req.param('gamma') || config.gamma || 0.1;
    config.actionSelector = req.param('actionSelector') || config.actionSelector || 'greedy';
    config.epsilon = req.param('epsilon') || config.epsilon || 0.1;
    config.initQ = req.param('initQ') || config.initQ || 15;
    config.algorithm = req.param('algorithm') || config.algorithm || 'qlearning';

    // TODO:: find inferring
    var infer = {};
    for (var propertyName in config) {
      if (config.hasOwnProperty(propertyName)) {

        // if contain ',' then it is an infer
        if (typeof config[propertyName] !== 'string') {
          continue;
        }

        var _split = _.clone(config[propertyName]).split(',');
        if (_.size(_split) > 1) {
          infer = {
            name: propertyName,
            values: _.map(_split, function (s) {
              if (propertyName === 'actionSelector' || propertyName === 'algorithm') {
                return s.trim();
              } else {
                return s * 1.0;
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

    console.log('inferring:', infer);

    var averagingFactor = req.param('averagingFactor') || 20;
    async.auto(_.map(infer.values, function (v) {
        return function (callback) {
          var _config = _.clone(config);
          _config[infer.name] = v;

          // ensure config is valid
          for (var propertyName in _config) {
            if (config.hasOwnProperty(propertyName)) {
              if (propertyName === 'actionSelector' || propertyName === 'algorithm') {
                _config[propertyName] = _config[propertyName].trim();
              } else {
                _config[propertyName] = _config[propertyName] * 1.0;
              }
            }
          }

          Helpers.averagingFunction(averagingFactor, singleAgentLearning[_config.algorithm], _config, callback);
        }
      }), function (err, results) {
        // summarize the respond

        var graphData = {
          averageSteps: {
            series: []
          },
          optimalActionPercentage: {
            series: []
          }
        };

        console.log('done');

        if (req.param('output') === 'toLatex') {
          for (var tl = 0; tl < _.size(results); tl++) {
            graphData.optimalActionPercentage.series.push({
              name: [infer.name, infer.values[tl]].join('='),
              data: _.map(_.pluck(results[tl].result, 'optimalActionPercentage'), function (v, index) { return '(' + (index + 1) + ',' + v + ')'; }).join('')
            });

            graphData.averageSteps.series.push({
              name: [infer.name, infer.values[tl]].join('='),
              data: _.map(_.pluck(results[tl].result, 'step'), function (v, index) { return '(' + (index + 1) + ',' + v + ')'; }).join('')
            });
          }
        }
        else {
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
        }
        return res.json(_.assign(graphData, {config: config}));
      }
    )


  }
};

