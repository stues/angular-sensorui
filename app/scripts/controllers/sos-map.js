'use strict';

/**
 * @ngdoc function
 * @name angularol3jsuiApp.controller:SOSMapCtrl
 * @description
 * # SOSMapCtrl
 * Controller which handles the received data from a SOS-Server:
 *  -Converts the SOS Data
 *  -Display the data on a WebMap
 */
angular.module('angularol3jsuiApp')
  .controller(
  'SOSMapCtrl',
  [
    '$scope',
    '$interval',
    '$controller',
    'SOSJSONService',
    'sosConfig',
    'olData',
    function ($scope, $interval, $controller, SOSJSONService, sosConfig, olData) {
      BaseMapController.call(this, $scope, $interval, $controller, SOSJSONService, sosConfig, olData);

      /**
       * Update map with given entries
       * @param observations the new entries
       */
      $scope.applyRemoteData = function(observations) {
        var observationsLength = observations.length;
        for (var i = 0; i < observationsLength; i++) {
          var observation = observations[i];
          if (observation.observableProperty in sosConfig.properties) {
            var result = observation.result;

            if (!angular.isObject($scope.features[observation.featureOfInterest])) {
              $scope.features[observation.featureOfInterest] = {};
              $scope.features[observation.featureOfInterest].properties = {};
              $scope.features[observation.featureOfInterest].id = observation.featureOfInterest;
            }

            $scope.features[observation.featureOfInterest].properties.messageGenerated = new Date(observation.resultTime);
            $scope.features[observation.featureOfInterest].properties.messageReceived = $scope.currentDate();

            var propertyType = sosConfig.properties[observation.observableProperty].type;
            var propertyName = sosConfig.properties[observation.observableProperty].name;

            if (propertyType === 'number') {
              $scope.features[observation.featureOfInterest].properties[propertyName] = result.value;
            }
            else if (propertyType === 'string') {
              $scope.features[observation.featureOfInterest].properties[propertyName] = result;
            }
            else if (propertyType === 'geojson') {
              $scope.features[observation.featureOfInterest][propertyName] = result;
            }

            $scope.updateRealTimePointFeature($scope.features[observation.featureOfInterest]);
          }
        }
      };
    }]);
