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
  function ($scope, $interval, $controller, service, implementationConfig, mapConfig, olData, FeatureStyleService) {

    angular.extend($scope, {
      //OpenLayers3 specific
      olCenter: mapConfig.olCenter,
      olBackgroundLayer: mapConfig.olBackgroundLayer,
      olDefaults: mapConfig.olDefaults,
      olGeoJSONFormat: new ol.format.GeoJSON({
        defaultDataProjection: implementationConfig.dataProjection
      })
    });

    var initialized = false;

    var cleanupInterval;

    var featureAttributes = {
      dataProjection: implementationConfig.dataProjection,
      featureProjection: mapConfig.mapProjection
    };

    var featureSource = new ol.source.Vector({
      projection: mapConfig.mapProjection
    });

    var featureLayer = new ol.layer.Vector({
      title: implementationConfig.featureLayerName,
      source: featureSource
    });

    var timeDeltaController;

    /**
     * Initializes the map
     * adds the featureLayer to the map
     */
    function initFeatureLayer() {
      if (!initialized) {
        olData.getMap().then(function (map) {
          map.addLayer(featureLayer);
        });
      }
      initialized = true;
    }

    /**
     * Initializes the time delta model
     */
    function initTimeDeltaModel() {
      if (!timeDeltaController) {
        timeDeltaController = $scope.$new();
        timeDeltaController.deltaName = implementationConfig.timeDeltaName;
        $controller('TimeDeltaCtrl', {$scope: timeDeltaController});
      }
    }

    /**
     * Update the featureSource with given data
     * @param features the new values
     */
    function applyRemoteData(features) {
      for (var featureId in features) {
        if (features.hasOwnProperty(featureId)) {
          $scope.updateRealTimePointFeature(features[featureId]);
        }
      }
    }

    /**
     * Starts the cleanup interval
     */
    $scope.startCleanupInterval = function () {
      if (!angular.isDefined(cleanupInterval)) {
        cleanupInterval = $interval(function () {
          $scope.removeOldFeatures();
        }, implementationConfig.cleanupInterval);
      }
    };

    /**
     * Stops the cleanup interval
     */
    $scope.stopCleanupInterval = function () {
      if (angular.isDefined(cleanupInterval)) {
        $interval.cancel(cleanupInterval);
        cleanupInterval = undefined;
      }
    };

    /**
     * Removes all features which are older than a given range
     */
    $scope.removeOldFeatures = function () {
      var currentMillis = new Date();
      var currentSeconds = currentMillis - implementationConfig.cleanupInterval;
      featureSource.forEachFeature(function (feature) {
        var featureSeenDate = feature.get('messageReceived');
        if (currentSeconds > featureSeenDate) {
          featureSource.removeFeature(feature);
          $scope.$broadcast('featureRemoved', feature);
        }
      });
    };

    /**
     * Applies the given callback to all current features within the featureSource
     * @param callback the callback
     */
    $scope.forEachFeature = function(callback){
      featureSource.forEachFeature(callback);
    };

    /**
     * Updates the given object within the map. If it does not exist already, it will be added to the map
     * @param object the object to be added to the map
     */
    $scope.updateRealTimePointFeature = function (object) {
      var id = object.id;

      if (id) {
        var currentFeature = featureSource.getFeatureById(id);
        if (!currentFeature) {
          if (object.geometry) {
            var geoJsonFeature = $scope.olGeoJSONFormat.readFeature(object, featureAttributes);
            geoJsonFeature.set('receivedGeometry', object.geometry);
            currentFeature = geoJsonFeature;
          }
          else {
            currentFeature = new ol.Feature();
            currentFeature.setId(id);
            currentFeature.setProperties(object.properties);
          }
          currentFeature.setStyle(FeatureStyleService.getStyle(currentFeature));
          featureSource.addFeature(currentFeature);
          $scope.$broadcast('featureAdded', currentFeature);
        }
        else {
          var properties = currentFeature.getProperties();
          $.extend(true, properties, object.properties);
          currentFeature.setProperties(properties);
          if (object.geometry) {
            var geometry = $scope.olGeoJSONFormat.readGeometry(object.geometry, featureAttributes);
            currentFeature.setGeometry(geometry);
            currentFeature.set('receivedGeometry', object.geometry);
          }
          FeatureStyleService.updateStyle(currentFeature);
          $scope.$broadcast('featureChanged', currentFeature);
        }

        timeDeltaController.addDelta(object.properties.messageGenerated, object.properties.messageReceived);
      }
    };

    /**
     * Returns the configured service
     * @returns {service|*}
     */
    $scope.getService = function(){
      return service;
    };

    /**
     * Returns the implementation specific config
     * @returns {implementationConfig|*}
     */
    $scope.getConfig = function(){
      return implementationConfig;
    };

    /**
     * Cleanup interval on destroy
     */
    $scope.$on('$destroy', function () {
      $scope.stopCleanupInterval();
    });

    /**
     * Do Subscribe on service to receive messages
     */
    service.subscribeMessages(function (message) {
      applyRemoteData(message);
    });

    /**
     * Do subscribe on service to receive current state of the service
     */
    service.subscribeEnableState(function (enabled) {
      if (enabled) {
        initTimeDeltaModel();
        initFeatureLayer();
        $scope.startCleanupInterval();
      }
      else {
        $scope.stopCleanupInterval();
      }
    });
  }
)
;

