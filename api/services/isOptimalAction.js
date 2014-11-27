module.exports = function (initState, endState) {
  var getDistance = function (state) {
    var x = state.split('_');
    return Math.abs(x[0] * 1.0) + Math.abs(x[1] * 1.0);
  };

  return getDistance(endState) < getDistance(initState);
};