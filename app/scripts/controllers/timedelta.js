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
  'TimeDeltaCtrl',
  [
    '$scope',
    '$interval',
    'deltaConfig',
    function ($scope, $interval, deltaConfig) {

      var persistInterval;

      /**
       * Load the Data from the configured store
       */
      function loadVariablesFromStore(){
        $scope.savedDeltas = localStorage.getItem($scope.deltaName);
        $scope.deltas = [];
        if ($scope.savedDeltas) {
          $scope.savedDeltas = JSON.parse($scope.savedDeltas);
        }
        else {
          $scope.savedDeltas = [];
          localStorage.setItem($scope.deltaName, JSON.stringify($scope.savedDeltas));
        }
      }

      /**
       * Perform loading of the data
       */
      $scope.loadLocalStore = function () {
        console.log($scope.deltaName);
        loadVariablesFromStore();


        if (!angular.isDefined(persistInterval)) {
          persistInterval = $interval(function () {
            if ($scope.deltas.length > 0) {
              var amount = $scope.deltas.length;
              var meanDelta = 0;
              for (var i in $scope.deltas) {
                meanDelta += $scope.deltas[i].delta;
              }

              var startCreationTime = $scope.deltas[0].creationDate;
              var endCreationTime = $scope.deltas[amount - 1].creationDate;
              var startReceivedTime = $scope.deltas[0].receivedDate;
              var endReceivedTime = $scope.deltas[amount - 1].receivedDate;
              meanDelta /= amount;

              $scope.deltas = [];

              $scope.savedDeltas.push({
                startCreationTime: startCreationTime,
                endCreationTime: endCreationTime,
                startReceivedTime: startReceivedTime,
                endReceivedTime: endReceivedTime,
                amount: amount,
                meanDelta: meanDelta
              });

              if (!$scope.$$phase) {
                $scope.$apply();
              }
              localStorage.setItem($scope.deltaName, JSON.stringify($scope.savedDeltas));
            }
            else {
              loadVariablesFromStore();
              if (!$scope.$$phase) {
                $scope.$apply();
              }
            }
          }, deltaConfig.persistInterval);
        }
        ;
      };

      /**
       * Clear the deltas from the local store
       */
      $scope.clearDeltas = function () {
        $scope.savedDeltas = [];
        localStorage.setItem($scope.deltaName, JSON.stringify($scope.savedDeltas));
      };

      /**
       * Calculate the delta from the two given date object and it to the store
       * @param creationDate the creation Date
       * @param receivedDate the received Date
       */
      $scope.addDelta = function (creationDate, receivedDate) {
        $scope.deltas.push({
          creationDate: creationDate.getTime(),
          receivedDate: receivedDate.getTime(),
          delta: receivedDate.getTime() - creationDate.getTime()
        });
      };


      if ($scope.deltaName) {
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

    }]);
