/***
 * relative distance encoder
 * @param predatorCoord
 * @param preyCoord
 * @returns {string}
 */
module.exports = function (predatorCoord, preyCoord, worldSize) {

  // start - target location
  var x = predatorCoord.x - preyCoord.x;
  var y = predatorCoord.y - preyCoord.y;

  return [ toroidalConvertion(x, worldSize / 2, worldSize), toroidalConvertion(y, worldSize / 2, worldSize)].join('_');
};
