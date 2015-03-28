'use strict';

/**
 * @ngdoc function
 * @name angularol3jsuiApp.controller:WebsocketMapCtrl
 * @description
 * # WebsocketMapCtrl
 * Controller which handles the received data from a Websocket:
 *  - Aggregate the received Data with already received Feature-Data
 *  - Display the Features on a WebMap
 */
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
      $controller('BaseMapController', {
        $scope: $scope,
        $interval: $interval,
        $controller: $controller,
        service: WebsocketGeoJSONService,
        config: websocketConfig,
        olData: olData
      });

      /**
       * Update the $scope.features with given data
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
            jQuery.extend(true, currentObject, jsonObject);
          }

          currentObject.properties.messageReceived = $scope.currentDate();
          if (currentObject.properties.messageGenerated) {
            currentObject.properties.messageGenerated = new Date(jsonObject.properties.messageGenerated);
          }

          $scope.updateRealTimePointFeature(currentObject);
        }
      };
    }
  ]);
