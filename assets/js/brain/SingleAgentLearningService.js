angular.module('gridWorldApp')
  .factory('SingleAgentLearningService', function ($http, $q) {
    return {

      inferrence: function (configObj, cb) {
        $http.post('/singleAgentLearning/inferring', {config: configObj})
          .success(function (respond) {
            return cb(null, respond);
          })
          .error(function (errMessage) {
            return cb(errMessage);
          });
      }

    };
  });