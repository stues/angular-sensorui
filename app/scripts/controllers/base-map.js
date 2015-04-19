'use strict';

/**
 * @ngdoc function
 * @name BaseMapController
 * @description
 * # BaseMapController
 * This Controller contains base functions for a Map Controller
 */
angular.module('angularol3jsuiApp')
  .controller(
  'BaseMapController',
  function ($scope, $interval, $controller, service, serviceConfig, mapConfig, olData, FeatureStyleService) {

    angular.extend($scope, {
      olCenter: mapConfig.olCenter,
      olBackgroundLayer: mapConfig.olBackgroundLayer,
      olDefaults: mapConfig.olDefaults
    });

    $scope.features = {};

    $scope.showTable = false;

    $scope.filterArea = false;

    $scope.cleanupInterval = undefined;

    $scope.initialized = false;

    var geoJSONFormat = new ol.format.GeoJSON(mapConfig.olGeoJSONFormatOptions);

    var featureSource = new ol.source.Vector(mapConfig.olFeatureSourceOptions);

    var featureLayer = new ol.layer.Vector({
      title: 'Tracks',
      source: featureSource
    });

    var filterAreaSource = new ol.source.Vector({projection: 'EPSG:3857'});
    var filterAreaLayer = new ol.layer.Vector({
      title: 'Filter Area',
      source: filterAreaSource,
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

    var timeDeltaModel = $scope.$new();
    timeDeltaModel.deltaName = serviceConfig.timeDeltaName;

    $controller('TimeDeltaCtrl', {$scope: timeDeltaModel});

    /**
     * Initializes the map
     * adds the filterAreaLayer and the featureLayer
     */
    function init() {
      if (!$scope.initialized) {
        olData.getMap().then(function (map) {
          map.addLayer(filterAreaLayer);
          map.addLayer(featureLayer);
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
        }, serviceConfig.cleanupInterval);
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
      var currentSeconds = currentMillis - serviceConfig.cleanupInterval;
      var i = 0;
      for (var id in $scope.features) {
        if ($scope.features.hasOwnProperty(id)) {
          i++;
          var feature = $scope.features[id];
          var featureSeenDate = feature.properties.messageReceived;
          if (currentSeconds > featureSeenDate) {
            delete $scope.features[id];
            var featureToRemove = featureSource.getFeatureById(id);
            if (featureToRemove) {
              featureSource.removeFeature(featureToRemove);
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
          var geoJsonFeature = geoJSONFormat.readFeature(object, {featureProjection: 'EPSG:3857'});
          var currentFeature = featureSource.getFeatureById(id);
          if (!currentFeature) {
            currentFeature = geoJsonFeature;
            currentFeature.setStyle(FeatureStyleService.getStyle(currentFeature));
            featureSource.addFeature(currentFeature);
          }
          else {
            currentFeature.setProperties(object.properties);
            FeatureStyleService.updateStyle(currentFeature);
          }
          currentFeature.setGeometry(geoJsonFeature.getGeometry());
        }

        timeDeltaModel.addDelta(object.properties.messageGenerated, object.properties.messageReceived);
      }
    };

    /**
     * Toggles between Filtering Area and no filter
     */
    $scope.toggleFilterArea = function () {
      init();
      var area;
      if (!$scope.filterArea) {
        area = serviceConfig.areaFilter;
        var geoJsonFeature = geoJSONFormat.readFeature(area, {featureProjection: 'EPSG:3857'});
        geoJsonFeature.setId('filterArea');
        filterAreaSource.addFeature(geoJsonFeature);
        $scope.filterArea = true;
      }
      else {
        area = undefined;
        var featureToRemove = filterAreaSource.getFeatureById('filterArea');
        if (featureToRemove) {
          filterAreaSource.removeFeature(featureToRemove);
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
      for (var featureId in $scope.features) {
        if ($scope.features.hasOwnProperty(featureId)) {
          $scope.updateRealTimePointFeature($scope.features[featureId]);
        }
      }
    };

    /**
     * Returns the current date
     * @returns {Date} the current date
     */
    $scope.currentDate = function(){
      return new Date();
    };

    /**
     * Do subscribe on service to receive current state of the service
     */
    service.subscribeEnableState(function (enabled) {
      if (enabled) {
        init();
        $scope.startCleanupInterval();
      }
      else {
        $scope.stopCleanupInterval();
      }
    });
  });

