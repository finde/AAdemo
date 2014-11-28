// Internal function: creates a callback bound to its context if supplied
// Copied from underscore.js:
// https://github.com/jashkenas/underscore/blob/master/underscore.js
var createCallback = function (func, context, argCount) {
  if (!context) {
    return func;
  }
  switch (argCount == null ? 3 : argCount) {
    case 1:
      return function (value) {
        return func.call(context, value);
      };
    case 2:
      return function (value, other) {
        return func.call(context, value, other);
      };
    case 3:
      return function (value, index, collection) {
        return func.call(context, value, index, collection);
      };
    case 4:
      return function (accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
  }
  return function () {
    return func.apply(this, arguments);
  };
};

// An internal function to generate lookup iterators.
// Copied from underscore.js:
// https://github.com/jashkenas/underscore/blob/master/underscore.js
var lookupIterator = function (value, context, argCount) {
  if (value == null) {
    return _.identity;
  }
  if (_.isFunction(value)) {
    return createCallback(value, context, argCount);
  }
  if (_.isObject(value)) {
    return _.matches(value);
  }
  return _.property(value);
};


// return the index of the smallest element in the array "obj".
// If "iterator" is given, it is called on each element and the result is used for comparison.
var argmin = function (obj, iterator, context) {
  var min = null, argmin = null, value;
  if (iterator) {
    iterator = lookupIterator(iterator, context);
  }
  for (var i = 0, length = obj.length; i < length; i++) {
    value = iterator ? iterator(obj[i]) : obj[i];
    if (min == null || value < min) {
      min = value;
      argmin = i;
    }
  }
  return argmin;
};


// return the index of the largest element in the array "obj".
// If "iterator" is given, it is called on each element and the result is used for comparison.
var argmax = function (obj, iterator, context) {
  var max = null, argmax = null, value;
  if (iterator) {
    iterator = lookupIterator(iterator, context);
  }
  for (var i = 0, length = obj.length; i < length; i++) {
    value = iterator ? iterator(obj[i]) : obj[i];
    if (max == null || value > max) {
      max = value;
      argmax = i;
    }
  }
  return argmax;
};

module.exports = argmax;