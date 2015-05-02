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
  .config(function ($routeProvider, appConfig) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/delta-table', {
        templateUrl: 'views/delta-table.html',
        controller: 'TimeDeltaCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });

    if (appConfig.mapPages) {
      var mapPages = appConfig.mapPages;
      var mapPagesLength = mapPages.length;
      for (var i = 0; i < mapPagesLength; i++) {
        var mapPageConfig = mapPages[i];
        $routeProvider.when(mapPageConfig.url, {
          templateUrl: 'views/map.html',
          controller: 'MapController',
          resolve: {
            implementationConfig: mapPageConfig.config,
            dataService: mapPageConfig.dataService,
            styleService: mapPageConfig.styleService
          }
        });
      }
    }
  }
)
;
