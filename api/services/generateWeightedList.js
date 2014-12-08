module.exports = function (list) { 
  var weighted_list = [];

  // Loop over weights
  for (var i = 0; i < list.length; i++) {
    var multiples = list[i] * 100; // 2 digits precision

    // Loop over the list of items
    for (var j = 0; j < multiples; j++) {
      weighted_list.push(list[i]);
    }
  }

  return weighted_list;
};
