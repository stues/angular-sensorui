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
    }
  ]);
