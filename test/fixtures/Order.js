/**
 * Created by finde on 04/08/14.
 */

module.exports = function () {
  'use strict';

  var _ = require('lodash');

  var fixture = {
    userRecurringOrder : {
      rows: [
        {  // without preselected farmers
          'selectedFarmer' : null,
          'id' : '8718215328186',
          'sku' : 'aard01',
          'recurringQuantity' : 6
        },
        {
          'selectedFarmer' : '53e8ec30761848414e56053b',
          'id' : '8718215329213',
          'sku' : 'aard112',
          'recurringQuantity' : 5
        }
      ]},
    sessionOrder : {
      rows: [
        {
          'id': '8718215329107',
          'sku' : 'aard01',
          'selectedQuantity': 0,
          'recurringQuantity': 2
        },
        {
          'selectedFarmer' : '53e8ec30761848414e56053b',
          'id' : '8718215329213',
          'sku' : 'aard112',
          'recurringQuantity': 20
        },
        {
          'sku': 'aard02',
          'id': '8718215327608',
          'selectedQuantity': 15
        }
      ]}
  };

  fixture.conceptFromSession = {
    'rows': [
      { // new
        'sku': 'aard112',
        'selectedFarmer':'53e8ec31761848414e560589',
//        'eanCodeHE': '8718215327516',
        'selectedQuantity': 2,
        'recurringQuantity': 2
      },
      { // updated from recurring
        'selectedFarmer' : '53e8ec30761848414e56053b',
//        'eanCodeHE' : '8718215329213',
        'sku' : 'aard400',
        'selectedQuantity': 2,
        'recurringQuantity': 1
      },
      { // updated from recurring without recurring Quantity
//        'eanCodeHE': '8718215329107',
        'sku': 'aard02',
        'selectedQuantity': 1
      }

    ]
  };
  fixture.setToDelivery = function (order) {
    return _.assign(_.clone(order), {
      status: 'delivery',
      'delivery': {
        'streetname': 'Rokin',
        'houseNr': '81',
        'cityName': 'Amsterdam',
        'phone': '067891011',
        'givenName': 'Finde',
        'familyName': 'Xumara',
        'postcode': '1011KL',
        'deliveryDate' : {
              "day" : "2014-09-12T00:00:00.000Z",
              "startime" : "17:30",
              "endtime" : "21:30",
              "lastEditDate" : "2014-09-08T00:00:00.000Z",
              "deliveryCost" : 10,
              "text" : "vrijdag 12 september 17:30-21:30"
        },
      }
    });
  };
  fixture.setToPayment = function (order) {
    return _.assign(_.clone(order), {
      status: 'payment',
      'payment': {
        'invoiceAddress': true,
        'bankNr': 'NL81RABO0152119817',
        'agree': true
      }
    });
  };
  fixture.setToConfirm = function (order) {
    return _.assign(_.clone(order), {
      status: 'confirm'
    });
  };
  fixture.setToConcept = function (order) {
    _.assign(_.clone(order), {
      status: 'concept',
      rows: [
        {
          'sku': 'aard01',
          'price': 3,
//          'name': '6 eieren',
//          'category': 'Boter, Kaas & Eieren',
//          'subcategory': 'Eieren',
//          'publishDate': '2014-07-16T22:00:00.000Z',
          'id': '53db586177e844fb106a2c4d',
          'selectedQuantity': 0,
          'recurringQuantity': 2
        },
        {
//          'id': '',
          'sku': 'aard02',
          'price': 2,
//          'name': 'volle yoghurt',
//          'category': 'Melk & Yogurt',
//          'subcategory': 'Zuivel',
//          'publishDate': '2014-07-16T22:00:00.000Z',
          'id': '53db586177e844fb106a2c4c',
          'selectedQuantity': 15,
          'recurringQuantity': 20
        },
        {
          'sku': 'pe01',
          'price': 5,
//          'name': 'Peren',
//          'category': 'Groente&Fruit',
//          'subcategory': 'Hardfruit',
//          'publishDate': '2014-07-16T22:00:00.000Z',
          'id': '53db9df39ceec347aa7c72f1',
          'selectedQuantity': 15
        }
      ]
    });
  };
  fixture.setToConcept2 = function (order) {
    _.assign(_.clone(order), {
      status: 'concept',
      rows: [
        {
          'sku': 'zu10',
          'price': 3,
          'name': '6 eieren',
          'category': 'Boter, Kaas & Eieren',
          'subcategory': 'Eieren',
          'publishDate': '2014-07-16T22:00:00.000Z',
          'id': '53db586177e844fb106a2c4d',
          'selectedQuantity': 0
        },
        {
          'sku': 'zu05',
          'price': 2,
          'name': 'volle yoghurt',
          'category': 'Melk & Yogurt',
          'subcategory': 'Zuivel',
          'publishDate': '2014-07-16T22:00:00.000Z',
          'id': '53db586177e844fb106a2c4c',
          'selectedQuantity': 15
        },
        {
          'sku': 'pe01',
          'price': 5,
          'name': 'Peren',
          'category': 'Groente&Fruit',
          'subcategory': 'Hardfruit',
          'publishDate': '2014-07-16T22:00:00.000Z',
          'id': '53db9df39ceec347aa7c72f1',
          'selectedQuantity': 15
        }

      ]
    });
  };

  return fixture;
}();