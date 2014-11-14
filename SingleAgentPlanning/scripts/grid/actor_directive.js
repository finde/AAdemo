'use strict';

angular.module('Actor', [])
.directive('actor', function() {
  return {
    restrict: 'A',
    scope: {
      state: '=',
      actorRole:'@',
      worldSize: '='
    },
    templateUrl: 'scripts/grid/actor.html',
    link: function(scope, element, attrs, controllers) {

      scope.$watch('state', function () {
        var tile = element.find('.tile');

        scope.unitSize = tile.width()+5;
        tile.css('top', scope.state.y * scope.unitSize +'px');
        tile.css('left', scope.state.x * scope.unitSize +'px');
      });

    },
  };
});