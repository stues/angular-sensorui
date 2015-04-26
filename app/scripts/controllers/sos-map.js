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
    'mapConfig',
    'olData',
    function ($scope, $interval, $controller, SOSJSONService, sosConfig, mapConfig, olData) {
      $controller('BaseMapController', {
        $scope: $scope,
        $interval: $interval,
        $controller: $controller,
        service: SOSJSONService,
        implementationConfig: sosConfig,
        mapConfig: mapConfig,
        olData: olData
      });
    }
  ]);
