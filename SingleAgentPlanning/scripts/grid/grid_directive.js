'use strict';

angular.module('Grid', [])
  .directive('grid', function ($templateCache) {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        ngModel: '='
      },
      templateUrl: 'scripts/grid/grid.html'
    };
  })
  .provider('GridService', World);