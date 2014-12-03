/**
 * Module dependencies.
 */

// try {console.time('require_core');}catch(e){}
var MultiAgentSystem = function () {
  this.randomPolicy = require('./randomPolicy');

  return this;
};

module.exports = new MultiAgentSystem();
