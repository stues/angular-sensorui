'use strict';

angular.module('angularol3jsuiApp')
  .controller(
  'WebsocketMapCtrl',
  [
    '$scope',
    '$interval',
    '$controller',
    'WebsocketGeoJSONService',
    'websocketConfig',
    'olData',
    function ($scope, $interval, $controller, WebsocketGeoJSONService, websocketConfig, olData) {
      BaseMapController.call(this, $scope, $interval, $controller, websocketConfig, olData);

      WebsocketGeoJSONService.subscribeMessages(function (message) {
        updateRealTimePointFeature(message.data);
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      });

      WebsocketGeoJSONService.subscribeEnablement(function (enabled) {
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
        var message;
        if (!$scope.filterArea) {
          message = websocketConfig.areaFilter;
          var geoJsonFeature = $scope.geoJSONFormat.readFeature(message, {featureProjection: 'EPSG:3857'});
          geoJsonFeature.setId("filterArea");
          $scope.filterAreaSource.addFeature(geoJsonFeature);
          $scope.filterArea = true;
        }
        else {
          message = websocketConfig.clearFilter;
          var featureToRemove = $scope.filterAreaSource.getFeatureById("filterArea");
          if (featureToRemove) {
            $scope.filterAreaSource.removeFeature(featureToRemove);
          }
          $scope.filterArea = false;
        }
        WebsocketGeoJSONService.sendMessage(JSON.stringify(message));
      }

      /**
       * Converts the given data as JSON if attribute already exist in $scope features the data will be updated.
       * otherwise the feature will be added to the scope
       * @param data a JSON String
       */
      function updateRealTimePointFeature(data) {
        var jsonObject = JSON.parse(data);

        if (!jsonObject.properties) {
          jsonObject.properties = {};
        }
        else {
          if (jsonObject.properties.messageGenerated) {
            jsonObject.properties.messageGenerated = new Date(jsonObject.properties.messageGenerated);
          }
        }

        jsonObject.properties.messageReceived = $scope.currentDate();

        var id = jsonObject.properties.hexIdent;

        if (id) {
          jsonObject.id = id;
          $scope.features[id] = jsonObject;


          if (jsonObject.geometry !== null) {
            var geoJsonFeature = $scope.geoJSONFormat.readFeature(jsonObject, {featureProjection: 'EPSG:3857'});

            var currentFeature = $scope.vectorSource.getFeatureById(id);
            if (!currentFeature) {
              currentFeature = geoJsonFeature;
              currentFeature.setStyle($scope.getStyle(currentFeature));
              $scope.vectorSource.addFeature(currentFeature);
            }
            else {
              currentFeature.setProperties(jsonObject.properties);
              $scope.updateStyle(currentFeature);
            }
            currentFeature.setGeometry(geoJsonFeature.getGeometry());
          }

          $scope.timeDeltaModel.addDelta(jsonObject.properties.messageGenerated, jsonObject.properties.messageReceived);
        }
      };

    }]);
