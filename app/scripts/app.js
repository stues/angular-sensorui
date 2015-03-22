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
    'openlayers-directive',
    'config'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/websocket-map', {
        templateUrl: 'views/map.html',
        controller: 'WebsocketMapCtrl'
      })
      .when('/sos-map', {
        templateUrl: 'views/map.html',
        controller: 'SOSMapCtrl'
      })
      .when('/delta-table', {
        templateUrl: 'views/delta-table.html',
        controller: 'TimeDeltaCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
