/***
 * Optimized State Space, with assumption environment / world is toroidal without boundaries / blocks
 * @param size
 * @param value
 * @constructor
 */
module.exports = function (size, value) {
  var world = new World();
  world.setSize(size);

  var worldSize = world.getSize();

  var _predatorStates = [];
  var _preyStates = [];
  var _stateSpace = {};

  // define individual stateSpace
  for (var x = 0; x < worldSize; x++) {
    for (var y = 0; y < worldSize; y++) {
      _predatorStates.push({x: x, y: y});
      _preyStates.push({x: x, y: y});
    }
  }

  // combination state
  for (var i = 0; i < _predatorStates.length; i++) {
    for (var j = 0; j < _preyStates.length; j++) {

      // encode relative distance
      var id = encodeRelativeDistance(_predatorStates[i], _preyStates[j], worldSize);

      // we do not need to check if it exist, but instead always overwrite, because it is the same
      _stateSpace[id] = {
        id: id,
        coord: {
          x: id.split('_')[0] * 1.0,
          y: id.split('_')[1] * 1.0
        },
        value: value
      };

    }
  }

  return _stateSpace;
};