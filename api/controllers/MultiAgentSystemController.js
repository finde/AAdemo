/**
 * MultiAgentSystemController
 *
 * @description :: Server-side logic for managing MultiAgentSystem
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var mas = require('../lib/multi_agent_system');
var numbers = require('numbers');

module.exports = {

  randomPolicy: function (req, res) {

    var config = req.param('config') || {};
//    console.log(req.param('config'));

    config = _.assign(config, {
      worldSize: 11,
      initPredator: [],
      initPrey: [
        { x: 5, y: 5}
      ]
    });

    /**
     * Dynamics setting
     * @param n = max 4
     * @returns {Array}
     */
    var initPredator = function (n) {
      var initLoc = [];
      var initPredatorLoc = [
        { x: 0, y: 0},
        { x: 10, y: 10},
        { x: 10, y: 0},
        { x: 0, y: 10}
      ];

      _.each(initPredatorLoc, function (loc, index) {
        if (index < n) {
          initLoc.push(loc);
        }
      });

      return initLoc;
    };

    function xrange(b0, b1, quanta) {
      if (!quanta) { quanta = 1; }
      if (!b1) {
        b1 = b0;
        b0 = 0;
      }
      out = [];
      for (var i = b0, idx = 0; i < b1; i += quanta, idx++) {
        out[idx] = i;
      }
      return out;
    }

//    run 15000 times for different number of predator
    var trials = 15000;
//    var trials = 200;
    var groupSize = 100;
    async.auto(
      _.map(xrange(4), function (nPredator) {
        return function (cb) {
          async.auto(_.map(xrange(trials), function () {
            return function (_cb) {
              var rPolicy = new mas.randomPolicy(_.assign(config, {initPredator: initPredator(nPredator + 1)}));
              rPolicy.runSingleEpisode(_cb, true);
            };
          }), function (err, _results) {
            cb(null, _.toArray(_results));
          });

        };
      }), function (err, results) {
        var successRate = [];
        var statistics = [];
        var successRateDetail = [];

        // for each settings
        _.each(results, function (nPredatorTrial) {
          var _predatorResult = _(nPredatorTrial).where({winner: 'predator'});
          var _preyResult = _(nPredatorTrial).where({winner: 'prey'});

          statistics.push({
            'predators': {
              standardDev: parseFloat(numbers.statistic.standardDev(_predatorResult.pluck('steps').value()).toFixed(2)),
              mean: parseFloat(numbers.statistic.mean(_predatorResult.pluck('steps').value()).toFixed(2))
            },
            'prey': {
              standardDev: parseFloat(numbers.statistic.standardDev(_preyResult.pluck('steps').value()).toFixed(2)),
              mean: parseFloat(numbers.statistic.mean(_preyResult.pluck('steps').value()).toFixed(2))
            },
            'all': {
              standardDev: parseFloat(numbers.statistic.standardDev(_.pluck(nPredatorTrial, 'steps')).toFixed(2)),
              mean: parseFloat(numbers.statistic.mean(_.pluck(nPredatorTrial, 'steps')).toFixed(2))
            }
          });

          var groupResults = _.groupBy(nPredatorTrial, function (r, index) { return Math.floor(index / groupSize); });

          var _successRate = { 'predator': '', 'prey': ''};
          _.each(groupResults, function (re, index) {
            var _predatorResult2 = _(re).where({winner: 'predator'});
            var _preyResult2 = _(re).where({winner: 'prey'});
            var _indexMax = ((index * 1) + 1) * groupSize;

            _successRate.predator += '(' + _indexMax + ',' + (_predatorResult2.size() * 100 / groupSize).toFixed(2) + ')';
            _successRate.prey += '(' + _indexMax + ',' + (_preyResult2.size() * 100 / groupSize).toFixed(2) + ')';
          });

          successRateDetail.push(_successRate);

          successRate.push({
            'predators': (_predatorResult.size()* 100 / groupSize).toFixed(2),
            'prey': (_preyResult.size()* 100 / groupSize).toFixed(2)
          });

        });

        res.json({
          'success-rate': successRate,
          'statistics': statistics,
          'detail-success-rate': successRateDetail
        });
      });

  },

  qlearning: function (req, res) {

    var result = mas.qLearning();
    console.log(result);

    return res.json(result);

  },

  minimaxQ: function (req, res) {
    var minimaxQ = mas.minimaxQ();

    return res.json(minimaxQ);
  },

  testLpSolve: function (req, res) {
    var lpsolve = require('lp_solve');
    var Row = lpsolve.Row;

    var lp = new lpsolve.LinearProgram();

    var x = lp.addColumn('x'); // lp.addColumn('x', true) for integer variable
    var y = lp.addColumn('y'); // lp.addColumn('y', false, true) for binary variable


    var objective = new Row().Add(x, 1).Add(y, 1);

    lp.setObjective(objective);

    var machineatime = new Row().Add(x, 50).Add(y, 24);
    lp.addConstraint(machineatime, 'LE', 2400, 'machine a time');

    var machinebtime = new Row().Add(x, 30).Add(y, 33);
    lp.addConstraint(machinebtime, 'LE', 2100, 'machine b time');

    lp.addConstraint(new Row().Add(x, 1), 'GE', 75 - 30, 'meet demand of x');
    lp.addConstraint(new Row().Add(y, 1), 'GE', 95 - 90, 'meet demand of y');

    console.log(lp.dumpProgram());
    console.log(lp.solve());
    console.log('objective =', lp.getObjectiveValue())
    console.log('x =', lp.get(x));
    console.log('y =', lp.get(y));
    console.log('machineatime =', lp.calculate(machineatime));
    console.log('machinebtime =', lp.calculate(machinebtime));

    res.ok();
  }
};

