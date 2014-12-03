module.exports = function () {
  'use strict';

  var fixture = [
    {
      title: 'Weekaanbod',
      name: 'Actueel',
      sub: [],
      banner: {
        text: '',
        url: ''
      },
      orderWeight: 1

    },
    {
      title: 'Groente & Fruit',
      name: 'GroenteFruit',
      sub: ['fruitpakket', 'seizoensfruit', 'appels'],
      banner: {
        text: '',
        image: 'banner.jpg',
        url: ''
      },
      orderWeight: 2
    },
    {
      title: 'Boter & Kaas',
      name: 'BoterKaas',
      sub: ['Boter', 'Koekaas', 'Geitenkaas', 'Schapenkaas', 'Jong', 'Belegen', 'Oud', 'Speciaal'],
      banner: {
        text: '',
        url: ''
      },
      orderWeight: 3

    },
    {
      title: 'Melk & Yoghurt',
      name: 'MelkYoghurt',
      sub: ['Melk', 'Yoghurt', 'Koe', 'Geit', 'Schaap', 'Mager', 'Halfvol', 'Vol', 'Specialiteiten'],
      banner: {
        text: '',
        url: ''
      },
      orderWeight: 4

    },
    {
      title: 'Brood',
      name: 'Brood',
      sub: ['Bruin', 'Wit', 'Gist broden', 'Desem broden', 'Kleinbrood', 'Kleinbrood'],
      banner: {
        text: '',
        url: ''
      },
      orderWeight: 5

    },
    {
      title: 'Vlees & Eieren',
      name: 'VleesEieren',
      sub: ['Eieren', 'Rund', 'Varken', 'Gevogelte', 'Specialiteiten', 'Belegen', 'Oud', 'Speciaal'],
      banner: {
        text: '',
        url: ''
      },
      orderWeight: 6

    },
    {
      title: 'Voorbeeldkist',
      name: 'VoorbeeldKist',
      sub: [],
      banner: {
        text: '',
        url: ''
      },
      orderWeight: 7

    }
  ];

  return fixture;
}();