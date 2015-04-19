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
    'mapConfig',
    'olData',
    function ($scope, $interval, $controller, WebsocketGeoJSONService, websocketConfig, mapConfig, olData) {
      $controller('BaseMapController', {
        $scope: $scope,
        $interval: $interval,
        $controller: $controller,
        service: WebsocketGeoJSONService,
        serviceConfig: websocketConfig,
        mapConfig: mapConfig,
        olData: olData
      });
    }
  ]);
