/**
 * toroidalConvertion
 * @param i
 * @param middle
 * @returns {*}
 */
module.exports = function (i, middle, worldSize) {
  if (i > middle) {
    i -= worldSize;
  }

  if (i < -1 * middle) {
    i += worldSize;
  }

  return i;
};