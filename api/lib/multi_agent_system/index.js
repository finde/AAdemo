/**
 * Module dependencies.
 */

// try {console.time('require_core');}catch(e){}
var MultiAgentSystem = function () {
  this.randomPolicy = require('./randomPolicy');
  this.minimaxQ = require('./minimaxQ');
  this.qLearning = require('./qlearning');

  return this;
};

module.exports = new MultiAgentSystem();
