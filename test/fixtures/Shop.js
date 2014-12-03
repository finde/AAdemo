module.exports = function () {
  'use strict';

  var fixture = {
    initShopImport: {
      source: 'test/assets/import-shops-basic.csv', // default
      shopLength: 258,
      randomShop: {
        id: 8718215327592,
        picture: 'test/assets/appels.jpg'
      }
    }
  };

  return fixture;
}();