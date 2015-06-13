'use strict';

/**
 * @ngdoc function
 * @name angularol3jsuiApp.controller:TimeDeltaCtrl
 * @description
 * # TimeDeltaCtrl
 * This Controller can be used as a time logger. It stores timedeltas in a local store
 */
angular.module('angularol3jsuiApp')
  .controller(
  'ReceivedDataCtrl',
  [
    '$scope',
    '$interval',
    'receivedDataConfig',
    function ($scope, $interval, receivedDataConfig) {

      var persistInterval;

      /**
       * Load the Data from the configured store
       */
      function loadVariablesFromStore() {
        $scope.savedDataObjects = localStorage.getItem($scope.receivedDataName);
        $scope.dataDeltas = [];

        if ($scope.savedDataObjects) {
          $scope.savedDataObjects = JSON.parse($scope.savedDataObjects);
        }
        else {
          $scope.savedDataObjects = [];
          localStorage.setItem($scope.receivedDataName, JSON.stringify($scope.savedDataObjects));
        }
      }

      /**
       * Perform loading of the data
       */
      $scope.loadLocalStore = function () {
        console.log($scope.receivedDataName);
        loadVariablesFromStore();

        if (!angular.isDefined(persistInterval)) {
          persistInterval = $interval(function () {
              if ($scope.dataDeltas.length > 0) {
                for (var i in $scope.dataDeltas) {
                  if ($scope.dataDeltas.hasOwnProperty(i)) {
                    $scope.savedDataObjects.push($scope.dataDeltas[i]);
                  }
                }
                $scope.dataDeltas = [];

                if (!$scope.$$phase) {
                  $scope.$apply();
                }

                localStorage.setItem($scope.receivedDataName, JSON.stringify($scope.savedDataObjects));

              } else {
                loadVariablesFromStore();
                if (!$scope.$$phase) {
                  $scope.$apply();
                }
              }
            },
            receivedDataConfig.persistInterval
          );
        }
      };

      /**
       * Clear the data from the local store
       */
      $scope.clearData = function () {
        $scope.savedDataObjects = [];
        localStorage.setItem($scope.receivedDataName, JSON.stringify($scope.savedDataObjects));
      };

      /**
       * Adds the given data to the received data list
       * @param data the data to add
       */
      $scope.addData = function (data) {
        var dataCopy = $.extend(true, {}, data);
        dataCopy.properties.messageGenerated = dataCopy.properties.messageGenerated.getTime();
        dataCopy.properties.messageReceived = dataCopy.properties.messageReceived.getTime();
        $scope.dataDeltas.push(dataCopy);
      };

      if ($scope.receivedDataName) {
        $scope.loadLocalStore();
      }

      /**
       * Stop interval on destroy
       */
      $scope.$on('$destroy', function () {
        if (angular.isDefined(persistInterval)) {
          $interval.cancel(persistInterval);
          persistInterval = undefined;
        }
      });

    }])
;
