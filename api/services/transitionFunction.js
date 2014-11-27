/***
 * transition function based on relative distance
 * @param currentState
 * @param actor : 'prey' or 'predator'
 * @param action
 * @param worldSize
 */
module.exports = function (currentState, actor, action, worldSize) {

  var x, y;
  var _currentState = _.clone(currentState);

  if (typeof _currentState == 'string') {
    _currentState = {
      x: _currentState.split('_')[0] * 1.0,
      y: _currentState.split('_')[1] * 1.0
    };
  }

  if (actor === 'prey') {
    x = _currentState.x + action.transition.x;
    y = _currentState.y + action.transition.y;
  } else { // predator
    x = _currentState.x - action.transition.x;
    y = _currentState.y - action.transition.y;
  }

  return [ toroidalConvertion(x, worldSize / 2, worldSize), toroidalConvertion(y, worldSize / 2, worldSize)].join('_');
};