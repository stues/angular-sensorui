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
      $scope.applyRemoteData = function(data) {
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
        }
        $scope.updateRealTimePointFeature(jsonObject)
      }

    }]);
