'use strict';

angular.module('angularol3jsuiApp')
  .controller(
  'menuController',
  [
    '$scope',
    '$location',
    'WebsocketGeoJSONService',
    'SOSJSONService',
    function ($scope, $location, WebsocketGeoJSONService, SOSJSONService) {

      $scope.status;

      $scope.messageCount;

      $scope.showCount = false;

      $scope.onMapPage = function () {
        if ($scope.getMapPage()) {
          return true;
        }
        else {
          return false;
        }
      };

      $scope.getMapPage = function () {
        var currentPath = $location.path();
        if (angular.equals(currentPath, '/websocket-map')) {
          return "websocket";
        }
        else if (angular.equals(currentPath, '/sos-map')) {
          return "sos";
        }
        return;
      };

      $scope.getCurrentService = function () {
        switch ($scope.getMapPage()) {
          case "websocket":
            return WebsocketGeoJSONService;
          case "sos":
            return SOSJSONService;
          default:
            return;
        }
      };

      $scope.getCommandLabel = function () {
        var service = $scope.getCurrentService();
        if (service) {
          return service.getNextOperationLabel();
        }
        return "";
      };

      $scope.commandLabel = $scope.getCommandLabel();

      $scope.connect = function () {
        var service = $scope.getCurrentService();
        if (service) {
          if (!service.isConnected()) {
            service.connect();
          } else {
            service.disconnect();
          }
        }
      };

      $scope.getMessageCount = function (messageCount, service) {
        var currentService = $scope.getCurrentService();
        if (currentService === service) {
          return messageCount;
        }
        if (currentService) {
          return currentService.getMessageCount();
        }
        return 0;
      };

      $scope.updateMessageCount = function (messageCount) {
        $scope.messageCount = messageCount;
        if ($scope.messageCount > 0) {
          $scope.showCount = $scope.onMapPage() && true;
        }
      };

      $scope.getCurrentMessageCount = function () {
        var currentService = $scope.getCurrentService();
        if (currentService) {
          return currentService.getMessageCount();
        }
        return 0;
      };

      $scope.updateStatus = function (status, service) {
        $scope.status = status;
        $scope.commandLabel = $scope.getCommandLabel();
        if (service.isConnected()) {
          $scope.showCount = $scope.onMapPage() && true;
        }
        else {
          $scope.showCount = false;
        }
      }


      $scope.getCurrentStatus = function(){
        var currentService = $scope.getCurrentService();
        if (currentService) {
          return currentService.getStatus();
        }
        return;
      }

      $scope.getStatus = function (status, service) {
        var currentService = $scope.getCurrentService();
        if (currentService === service) {
          return status;
        }
        if (currentService) {
          return currentService.getStatus();
        }
        return;
      };

      WebsocketGeoJSONService.subscribeStatus(function (message) {
        $scope.updateStatus($scope.getStatus(message, WebsocketGeoJSONService), WebsocketGeoJSONService);
      });

      SOSJSONService.subscribeStatus(function (message) {
        $scope.updateStatus($scope.getStatus(message, SOSJSONService), SOSJSONService);
      });

      WebsocketGeoJSONService
        .subscribeMessageAmount(function (msgsReceived) {
          $scope.updateMessageCount($scope.getMessageCount(msgsReceived, WebsocketGeoJSONService));
        });

      SOSJSONService
        .subscribeMessageAmount(function (msgsReceived) {
          $scope.updateMessageCount($scope.getMessageCount(msgsReceived, SOSJSONService));
        });


      $scope.$on('$locationChangeStart', function (event) {
        $scope.commandLabel = $scope.getCommandLabel();
        $scope.status = $scope.getCurrentStatus();
        $scope.messageCount = $scope.getCurrentMessageCount();
      });

    }]);
