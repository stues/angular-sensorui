'use strict';

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
      BaseMapController.call(this, $scope, $interval, $controller, sosConfig, olData);

      SOSJSONService.subscribeMessages(function (message) {
        applyRemoteData(message);
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      });

      SOSJSONService.subscribeEnablement(function (enabled) {
        if (enabled) {
          $scope.init();
          $scope.startCleanupInterval();
        }
        else {
          $scope.stopCleanupInterval();
        }
      });

      /**
       * Toggles between Filtering Area and no filter
       */
      $scope.toggleFilterArea = function () {
        $scope.init();
        if (!$scope.filterArea) {
          var geoJsonFeature = $scope.geoJSONFormat.readFeature(message, {featureProjection: 'EPSG:3857'});
          geoJsonFeature.setId("filterArea");
          $scope.filterAreaSource.addFeature(geoJsonFeature);
          $scope.filterArea = true;
        }
        else {
          var featureToRemove = $scope.filterAreaSource.getFeatureById("filterArea");
          if (featureToRemove) {
            $scope.filterAreaSource.removeFeature(featureToRemove);
          }
          $scope.filterArea = false;
        }
      }

      /**
       * Update map with given entries
       * @param entries the new entries
       */
      function applyRemoteData(entries) {
        var observations = entries.observations;

        var observationsLength = observations.length;
        for (var i = 0; i < observationsLength; i++) {
          var observation = observations[i];
          if (observation.observableProperty in sosConfig.properties) {

            var result = observation.result;

            if (!angular.isObject($scope.features[observation.featureOfInterest])) {
              $scope.features[observation.featureOfInterest] = {}
              $scope.features[observation.featureOfInterest].properties = {}
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

            updateRealTimePointFeature($scope.features[observation.featureOfInterest]);
          }
        }
      }

      /**
       *
       * @param {Array}
       * @returns OpenLayers.Feature.Vector
       */
      function updateRealTimePointFeature(object) {
        var id = object.id;

        if (id) {
          if (object.geometry) {
            var geoJsonFeature = $scope.geoJSONFormat.readFeature(object, {featureProjection: 'EPSG:3857'});
            var currentFeature = $scope.vectorSource.getFeatureById(id);
            if (!currentFeature) {
              currentFeature = geoJsonFeature;
              currentFeature.setStyle($scope.getStyle(currentFeature));
              $scope.vectorSource.addFeature(currentFeature);
            }
            else {
              currentFeature.setProperties(object.properties);
              $scope.updateStyle(currentFeature);
            }
            currentFeature.setGeometry(geoJsonFeature.getGeometry());
          }

          $scope.timeDeltaModel.addDelta(object.properties.messageGenerated, object.properties.messageReceived);
        }
      };

    }]);
