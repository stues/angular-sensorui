'use strict';

/**
 * @ngdoc overview
 * @name angularol3jsuiApp
 * @description
 * # angularol3jsuiApp
 *
 * Main module of the application.
 */
angular
  .module('angularol3jsuiApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'openlayers-directive'
  ]).controller('menuController', ['$scope', 'WebsocketGeoJSONService', function ($scope, WebsocketGeoJSONService) {

        $scope.connectCommandLabel = WebsocketGeoJSONService
            .getNextOperationLabel();

        $scope.status = WebsocketGeoJSONService.connectionStatus;

        $scope.showCount = false;

        $scope.messageCount = 0;

        $scope.messageCount = WebsocketGeoJSONService
            .getMessageCount();

        WebsocketGeoJSONService.subscribeStatus(function (message) {
            $scope.status = message;
            $scope.connectCommandLabel = WebsocketGeoJSONService
                .getNextOperationLabel();
            if(message == 'Connected'){
                $scope.showCount = true;
            }
            else{
                $scope.showCount = false;
            }
        });

        WebsocketGeoJSONService
            .subscribeMessageAmount(function (msgsReceived) {
                $scope.messageCount = msgsReceived;
                if($scope.messageCount > 0){
                    $scope.showCount = true;
                }
            });

        $scope.connect = function () {
            if (!WebsocketGeoJSONService.isConnected()) {
                WebsocketGeoJSONService.connect();

                $scope.connectCommandLabel = 'Disconnect';
            } else {
                WebsocketGeoJSONService.disconnect();

                $scope.connectCommandLabel = 'Connect';
            }
        };
    }])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/map', {
        templateUrl: 'views/map.html',
        controller: 'MapCtrl'
      })
      .when('/object-table', {
        templateUrl: 'views/object-table.html',
        controller: 'ObjectTableCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
