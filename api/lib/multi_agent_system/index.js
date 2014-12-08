/**
 * Module dependencies.
 */

// try {console.time('require_core');}catch(e){}
var MultiAgentSystem = function () {
  this.randomPolicy = require('./randomPolicy');x
  this.minimaxQ = require('./minimaxQ');
  return this;
};

module.exports = new MultiAgentSystem();
