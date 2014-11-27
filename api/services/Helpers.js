var shortid = require('shortid');
var now = require("performance-now")

module.exports = {

  averagingFunction: function (nTimes, learningFunction, opts, cb) {

    var start = now();

    nTimes = nTimes || 5;
    var queue = [];
    for (var i = 0; i < nTimes; i++) {
      queue.push(function (callback) {
        return learningFunction(_.assign(_.clone(opts), {id: shortid.generate()}), callback);
      });
    }

    // run async
    async.parallel(queue,
      function (err, results) {
        var _results = _.clone(_.first(results));

        // for each trial
        for (var j = 1; j < _.size(results); j++) {
          var r = results[j];

          // sum each episode
          for (var e = 0; e < _.size(r); e++) {
            _results[e].step += r[e].step;
            _results[e].optimalAction += r[e].optimalAction;
          }
        }

        for (var e = 0; e < _.size(_results); e++) {
          _results[e].step /= nTimes;
          _results[e].optimalAction /= nTimes;
          _results[e].optimalActionPercentage = parseFloat((_results[e].optimalAction / _results[e].step * 100).toFixed(2))
        }

        // average the results
        var end = now();

        cb(null, {
          config: opts,
          result: _results,
          elapsedTime: (end - start).toFixed(3)+'ms'
        });
      });
  }

};