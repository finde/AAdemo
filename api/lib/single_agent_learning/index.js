/**
 * Module dependencies.
 */

// try {console.time('require_core');}catch(e){}
var SingleAgentLearning = function () {
  this.qlearning = require('./qlearning');
  this.sarsa = require('./sarsa');
  this.offPolicyMC = require('./offPolicyMC');
  this.onPolicyMC = require('./onPolicyMC');

  return this;
};

module.exports = new SingleAgentLearning();