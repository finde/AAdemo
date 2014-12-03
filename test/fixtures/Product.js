module.exports = function () {
  'use strict';

  var fixture = {
    initProductImport: {
      source: 'test/assets/import-product-40.csv', // default
      samplesource: 'test/assets/20141009 Voorbeeldkisten.csv', // default
      productLength: 78,
      nonAdmin:{
        productLength: 1
      },
      randomProduct: {
        id: 8718215327363,
        farmer: 7,
        picture: 'test/assets/appels.jpg'
      }
    }
  };

  return fixture;
}();