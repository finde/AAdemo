/**
 * MultiAgentSystemController
 *
 * @description :: Server-side logic for managing MultiAgentSystem
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var mas = require('../lib/multi_agent_system');

module.exports = {

  // todo:: create report
  randomPolicy: function (req, res) {

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

    rPolicy.runSingleEpisode(function (output) {
      res.json(output);
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

