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
  ]).controller('MapCtrl', function ($scope) {
        $scope.awesomeThings = [
            'HTML5 Boilerplate',
            'AngularJS',
            'Karma'
        ];
    })
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
