module.exports = function (size, value) {
  var world = new World();
  world.setSize(size);

  var worldSize = world.getSize();

  var _predatorStates = [];
  var _preyStates = [];
  var _stateSpace = [];

  // define individual stateSpace
  for (var x = 0; x < worldSize; x++) {
    for (var y = 0; y < worldSize; y++) {
      _predatorStates.push({x: x, y: y});
      _preyStates.push({x: x, y: y});
    }
  }

  // combination state
  for (var x = 0; x < _predatorStates.length; x++) {
    for (var y = 0; y < _preyStates.length; y++) {

      _stateSpace.push({
        id: generateID(_predatorStates[x], _preyStates[y]),
        predator: _predatorStates[x],
        prey: _preyStates[y],
        value: value
      });

    }
  }

  return _stateSpace;
};