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
      BaseMapController.call(this, $scope, $interval, $controller, WebsocketGeoJSONService, websocketConfig, olData);

      /**
       * Update map with given data
       * @param data the new entries
       */
      $scope.applyRemoteData = function (data) {
        var jsonObject = JSON.parse(data);

        var id = jsonObject.properties.hexIdent;
        if (id) {
          var currentObject;
          if (!angular.isObject($scope.features[id])) {
            jsonObject.id = id;
            if (jsonObject.properties.messageGenerated) {
              jsonObject.properties.messageGenerated = new Date(jsonObject.properties.messageGenerated);
            }
            $scope.features[id] = jsonObject;
            currentObject = jsonObject;
          }
          else {
            currentObject = $scope.features[id];
            angular.extend(currentObject, jsonObject);
          }

          currentObject.properties.messageReceived = $scope.currentDate();
          if (currentObject.properties.messageGenerated) {
            currentObject.properties.messageGenerated = new Date(jsonObject.properties.messageGenerated);
          }

          $scope.updateRealTimePointFeature(currentObject);
        }
      }
    }
  ]);
