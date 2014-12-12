'use strict';

angular.module('angularol3jsuiApp')
  .controller(
  'TimeDeltaCtrl',
  [
    '$scope',
    '$interval',
    'deltaConfig',
    function ($scope, $interval, deltaConfig) {

      var persistInterval;

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


      if ($scope.deltaName) {
        $scope.loadLocalStore();
      }

      $scope.clearDeltas = function () {
        $scope.savedDeltas = [];
        localStorage.setItem($scope.deltaName, JSON.stringify($scope.savedDeltas));
      };

      $scope.addDelta = function (creationDate, receivedDate) {
        $scope.deltas.push({
          creationDate: creationDate.getTime(),
          receivedDate: receivedDate.getTime(),
          delta: receivedDate.getTime() - creationDate.getTime()
        });
      };

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
