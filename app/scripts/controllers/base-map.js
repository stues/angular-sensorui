'use strict';

/**
 * @ngdoc function
 * @name BaseMapController
 * @description
 * # BaesMapController
 * This Controller contains base functions for a Map Controller
 */
angular.module('angularol3jsuiApp')
  .controller(
  'BaseMapController',
  function ($scope, $interval, $controller, service, config, olData, FeatureStyleService) {

    $scope.features = {};

    $scope.showTable = false;

    $scope.filterArea = false;

    $scope.cleanupInterval = undefined;

    $scope.initialized = false;

    $scope.geoJSONFormat = new ol.format.GeoJSON({defaultDataProjection: 'EPSG:4326'});

    $scope.vectorSource = new ol.source.Vector({projection: 'EPSG:3857'});

    $scope.vectorLayer = new ol.layer.Vector({
      title: 'Tracks',
      source: $scope.vectorSource
    });

    $scope.filterAreaSource = new ol.source.Vector({projection: 'EPSG:3857'});
    $scope.filterAreaLayer = new ol.layer.Vector({
      title: 'Filter Area',
      source: $scope.filterAreaSource,
      style: [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'red',
          lineDash: [4],
          width: 3
        }),
        fill: new ol.style.Fill({
          color: 'rgba(0, 0, 255, 0.05)'
        })
      })]
    });

    angular.extend($scope, {
      switzerland: {
        lat: 46.801111,
        lon: 8.226667,
        zoom: 7
      },
      backgroundLayer: {
        source: {
          type: 'OSM'
        }
      },
      defaults: {
        interactions: {
          mouseWheelZoom: true
        },
        controls: {
          zoom: false,
          rotate: false,
          attribution: false
        }
      }
    });

    $scope.timeDeltaModel = $scope.$new();
    $scope.timeDeltaModel.deltaName = config.timeDeltaName;

    $controller('TimeDeltaCtrl', {$scope: $scope.timeDeltaModel});

    /**
     * Initializes the map
     * adds the filterAreaLayer and the vectorLayer
     */
    $scope.init = function () {
      if (!$scope.initialized) {
        olData.getMap().then(function (map) {
          map.addLayer($scope.filterAreaLayer);
          map.addLayer($scope.vectorLayer);
        });
      }
      $scope.initialized = true;
    };

    /**
     * Starts the cleanup interval
     */
    $scope.startCleanupInterval = function () {
      if (!angular.isDefined($scope.cleanupInterval)) {
        $scope.cleanupInterval = $interval(function () {
          $scope.removeOldFeatures();
          if (!$scope.$$phase) {
            $scope.$apply();
          }
        }, config.cleanupInterval);
      }
    };

    /**
     * Stops the cleanup interval
     */
    $scope.stopCleanupInterval = function () {
      if (angular.isDefined($scope.cleanupInterval)) {
        $interval.cancel($scope.cleanupInterval);
        $scope.cleanupInterval = undefined;
      }
    };

    /**
     * Cleanup interval on destroy
     */
    $scope.$on('$destroy', function () {
      $scope.stopCleanupInterval();
    });

    /**
     * Removes all features which are older than a given range
     */
    $scope.removeOldFeatures = function () {
      var currentMillis = new Date();
      var currentSeconds = currentMillis - config.cleanupInterval;
      var i = 0;
      for (var id in $scope.features) {
        if ($scope.features.hasOwnProperty(id)) {
          i++;
          var feature = $scope.features[id];
          var featureSeenDate = feature.properties.messageReceived;
          if (currentSeconds > featureSeenDate) {
            delete $scope.features[id];
            var featureToRemove = $scope.vectorSource.getFeatureById(id);
            if (featureToRemove) {
              $scope.vectorSource.removeFeature(featureToRemove);
            }
          }
        }
      }
      console.log('Amount of Features:', i);
    };

    /**
     * Updates the given object within the map. If it does not exist already, it will be added to the map
     * @param object the object to be added to the map
     */
    $scope.updateRealTimePointFeature = function (object) {
      var id = object.id;

      if (id) {
        if (object.geometry) {
          var geoJsonFeature = $scope.geoJSONFormat.readFeature(object, {featureProjection: 'EPSG:3857'});
          var currentFeature = $scope.vectorSource.getFeatureById(id);
          if (!currentFeature) {
            currentFeature = geoJsonFeature;
            currentFeature.setStyle(FeatureStyleService.getStyle(currentFeature));
            $scope.vectorSource.addFeature(currentFeature);
          }
          else {
            currentFeature.setProperties(object.properties);
            FeatureStyleService.updateStyle(currentFeature);
          }
          currentFeature.setGeometry(geoJsonFeature.getGeometry());
        }

        $scope.timeDeltaModel.addDelta(object.properties.messageGenerated, object.properties.messageReceived);
      }
    };

    /**
     * Toggles between Filtering Area and no filter
     */
    $scope.toggleFilterArea = function () {
      $scope.init();
      var area;
      if (!$scope.filterArea) {
        area = config.areaFilter;
        var geoJsonFeature = $scope.geoJSONFormat.readFeature(area, {featureProjection: 'EPSG:3857'});
        geoJsonFeature.setId('filterArea');
        $scope.filterAreaSource.addFeature(geoJsonFeature);
        $scope.filterArea = true;
      }
      else {
        area = undefined;
        var featureToRemove = $scope.filterAreaSource.getFeatureById('filterArea');
        if (featureToRemove) {
          $scope.filterAreaSource.removeFeature(featureToRemove);
        }
        $scope.filterArea = false;
      }
      service.setFilterArea(area);
    };

    /**
     * Do Subscribe on service to receive messages
     */
    service.subscribeMessages(function (message) {
      $scope.applyRemoteData(message);
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    });

    /**
     * Update the $scope.features with given data
     * @param features the new values
     */
    $scope.applyRemoteData = function (features) {
      $.extend(true, $scope.features, features);
      for (var featureId in features) {
        if ($scope.features.hasOwnProperty(featureId)) {
          $scope.updateRealTimePointFeature($scope.features[featureId]);
        }
      }
    };

    /**
     * Do subscribe on service to receive current state of the service
     */
    service.subscribeEnableState(function (enabled) {
      if (enabled) {
        $scope.init();
        $scope.startCleanupInterval();
      }
      else {
        $scope.stopCleanupInterval();
      }
    });


  });

