'use strict';

/**
 * @ngdoc function
 * @name angularol3jsuiApp.controller:menuController
 * @description
 * # menuController
 * Controller which handles the labels and buttons of the menu bar
 */
angular.module('angularol3jsuiApp')
  .controller(
  'menuController',
  [
    '$scope',
    '$location',
    '$injector',
    'appConfig',
    function ($scope, $location, $injector, appConfig) {

      var serviceURLs = {};
      var services = {};

      $scope.mapPages = [];

      $scope.status = undefined;

      $scope.messageCount = undefined;

      $scope.showCount = false;

      $scope.onMapPage = false;

      /**
       * Return true if either on WebsocketMap or on SOSMap
       * @returns {boolean} true if on Map Page otherwise false
       */
      $scope.isOnMapPage = function () {
        return angular.isDefined($scope.getMapIdentifier());
      };

      /**
       * Return the name of the current map page
       * @returns {string} the name of the current map or nothing if not on map page
       */
      $scope.getMapIdentifier = function () {
        var currentPath = $location.path();
        if (serviceURLs.hasOwnProperty(currentPath)) {
          return serviceURLs[currentPath];
        }
      };

      /**
       * @returns {*} the current service if on map page otherwise nothing will be returned
       */
      $scope.getCurrentService = function () {
        var mapId = $scope.getMapIdentifier();
        if (services[mapId]) {
          return services[mapId].service;
        }
      };

      /**
       * @returns {*} the label to display on the command button
       */
      $scope.getCommandLabel = function () {
        var service = $scope.getCurrentService();
        if (service) {
          return service.getNextOperationLabel();
        }
        return '';
      };

      $scope.commandLabel = $scope.getCommandLabel();

      /**
       * Connect the service of the current map page
       * if not on map page nothing will happen
       */
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

      /**
       * Returns the amount of messages
       * @param messageCount the message count
       * @param service the affected service
       * @returns {*} the amount of messages
       */
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

      /**
       * updates the displayed message count
       * @param messageCount the message count
       */
      $scope.updateMessageCount = function (messageCount) {
        $scope.messageCount = messageCount;
        if ($scope.messageCount > 0) {
          $scope.showCount = $scope.isOnMapPage() && true;
        }
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      };

      /**
       * The current message count
       * @returns {*} the current amount of messages
       */
      $scope.getCurrentMessageCount = function () {
        var currentService = $scope.getCurrentService();
        if (currentService) {
          return currentService.getMessageCount();
        }
        return 0;
      };

      /**
       * Performs the update of the current status
       * @param status the new status
       * @param service the current service
       */
      $scope.updateStatus = function (status, service) {
        $scope.status = status;
        $scope.commandLabel = $scope.getCommandLabel();
        if (service.isConnected()) {
          $scope.showCount = $scope.isOnMapPage() && true;
        }
        else {
          $scope.showCount = false;
        }
      };

      /**
       * Returns the current Status String
       * @returns {*} the current state
       */
      $scope.getCurrentStatus = function () {
        var currentService = $scope.getCurrentService();
        if (currentService) {
          return currentService.getStatus();
        }
      };

      /**
       * Returns the status for the given attributes
       * @param status the new status
       * @param service the affected service
       * @returns {*} the status of the current service
       */
      $scope.getStatus = function (status, service) {
        var currentService = $scope.getCurrentService();
        if (currentService === service) {
          return status;
        }
        if (currentService) {
          return currentService.getStatus();
        }
      };

      /**
       * Registers a status and a message count listener on the given featureService
       * @param featureService the feature service
       */
      function registerServiceListener(featureService) {
        featureService.subscribeStatus(function (status) {
          $scope.updateStatus($scope.getStatus(status, featureService), featureService);
        });

        featureService
          .subscribeMessageCount(function (messageCount) {
            $scope.updateMessageCount($scope.getMessageCount(messageCount, featureService));
          });
      }

      //Initialize Service-Objects
      if (appConfig.mapPages) {
        var mapPages = appConfig.mapPages;
        var mapPagesLength = mapPages.length;
        for (var i = 0; i < mapPagesLength; i++) {
          var mapPageConfig = mapPages[i];
          var featureService = $injector.get(mapPageConfig.dataService);
          if (featureService) {
            services[mapPageConfig.id] = {
              url: mapPageConfig.url,
              service: featureService
            };
            serviceURLs[mapPageConfig.url] = mapPageConfig.id;
            $scope.mapPages[i] = {
              url: mapPageConfig.url,
              id: mapPageConfig.id,
              displayName: mapPageConfig.displayName
            };
            registerServiceListener(featureService);
          }
        }
      }

      /**
       * Do update labels and status on location change
       */
      $scope.$on('$locationChangeStart', function () {
        $scope.commandLabel = $scope.getCommandLabel();
        $scope.status = $scope.getCurrentStatus();
        $scope.messageCount = $scope.getCurrentMessageCount();
        $scope.onMapPage = $scope.isOnMapPage();
        $scope.showCount = $scope.getCurrentMessageCount() > 0 && $scope.isOnMapPage();
      });
    }])
;
