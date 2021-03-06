'use strict';

/**
 * @ngdoc function
 * @name MapController
 * @description
 * # MapController
 * This Controller contains functions Map Visualisation of Feature Data
 */
angular.module('angularol3jsuiApp')
  .controller(
  'MapController',
  function ($scope, $interval, $controller, dataService, styleService, implementationConfig, mapConfig, olData) {

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

    var receivedDataController;

    /**
     * Initializes the map
     * adds the featureLayer to the map
     */
    function initFeatureLayer() {
      if (!initialized) {
        initialized = true;
        olData.getMap().then(function (map) {
          map.addLayer(featureLayer);
        });
      }
    }

    /**
     * Initializes the time delta model
     */
    function initTimeDeltaModel() {
      if (!timeDeltaController && implementationConfig.enableTimeDeltaLogger) {
        timeDeltaController = $scope.$new();
        timeDeltaController.deltaName = implementationConfig.timeDeltaLoggerName;
        $controller('TimeDeltaCtrl', {$scope: timeDeltaController});
      }
    }

    /**
     * Initializes the time delta model
     */
    function initReceivedDataModel() {
      if (!receivedDataController && implementationConfig.enableReceivedDataLogger) {
        receivedDataController = $scope.$new();
        receivedDataController.receivedDataName = implementationConfig.receivedDataLoggerName;
        $controller('ReceivedDataCtrl', {$scope: receivedDataController});
      }
    }

    /**
     * Update the featureSource with given data
     * @param features the new values
     */
    function applyRemoteData(features) {
      if(angular.isArray(features)){
        var featuresSize = features.length;
        for(var i = 0; i < featuresSize; i++){
          $scope.addOrUpdateFeature(features[i]);
        }
      }
      else {
        for (var featureId in features) {
          if (features.hasOwnProperty(featureId)) {
            $scope.addOrUpdateFeature(features[featureId]);
          }
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
      var oldestMoment = currentMillis - implementationConfig.cleanupInterval;
      featureSource.forEachFeature(function (feature) {
        var featureSeenDate = feature.get('messageReceived');
        if (oldestMoment > featureSeenDate) {
          featureSource.removeFeature(feature);
          $scope.$broadcast('featureRemoved', feature);
        }
      });
    };

    /**
     * Applies the given callback to all current features within the featureSource
     * @param callback the callback
     */
    $scope.forEachFeature = function (callback) {
      featureSource.forEachFeature(callback);
    };

    /**
     * Creates a new ol.Feature object, and fills the object with information provided from the given object
     * @param object the object
     * @returns {*} a ol.Feature instance
     */
    function createFeature(object) {
      var currentFeature;
      if (object.geometry) {
        var geoJsonFeature = $scope.olGeoJSONFormat.readFeature(object, featureAttributes);
        geoJsonFeature.set('receivedGeometry', object.geometry);
        currentFeature = geoJsonFeature;
      }
      else {
        currentFeature = new ol.Feature();
        currentFeature.setId(object.id);
        currentFeature.setProperties(object.properties);
      }
      currentFeature.setStyle(styleService.getStyle(currentFeature));
      return currentFeature;
    }

    /**
     * Updates the given featureSourceFeature with information provided from the given object
     * @param featureSourceFeature the feature source feature
     * @param object the object with changed information
     * @returns {*} a ol.Feature instance
     */
    function updateFeature(featureSourceFeature, object) {
      var properties = featureSourceFeature.getProperties();
      $.extend(true, properties, object.properties);
      featureSourceFeature.setProperties(properties);
      if (object.geometry) {
        var geometry = $scope.olGeoJSONFormat.readGeometry(object.geometry, featureAttributes);
        featureSourceFeature.setGeometry(geometry);
        featureSourceFeature.set('receivedGeometry', object.geometry);
      }
      styleService.updateStyle(featureSourceFeature);
      return featureSourceFeature;
    }

    /**
     * Adds or Updates the given object within $scope.featureSource. If it does not exist already, it will be added to the map
     * @param object the object to be added to the map
     */
    $scope.addOrUpdateFeature = function (object) {
      var id = object.id;

      if (id) {
        var featureSourceFeature = featureSource.getFeatureById(id);
        if (featureSourceFeature) {
          $scope.$broadcast('featureChanged', updateFeature(featureSourceFeature, object));
        }
        else {
          var createdFeature = createFeature(object);
          featureSource.addFeature(createdFeature);
          $scope.$broadcast('featureAdded', createdFeature);
        }

        if(timeDeltaController) {
          timeDeltaController.addDelta(object.properties.messageGenerated, object.properties.messageReceived);
        }
        if(receivedDataController) {
          receivedDataController.addData(object);
        }
      }
    };

    /**
     * Returns the configured dataService
     * @returns {dataService|*}
     */
    $scope.getDataService = function () {
      return dataService;
    };

    /**
     * Returns the implementation specific config
     * @returns {implementationConfig|*}
     */
    $scope.getConfig = function () {
      return implementationConfig;
    };

    /**
     * Cleanup interval on destroy
     */
    $scope.$on('$destroy', function () {
      $scope.stopCleanupInterval();
    });

    /**
     * Do Subscribe on dataService to receive messages
     */
    dataService.subscribeMessages(function (features) {
      applyRemoteData(features);
    });

    /**
     * Do subscribe on dataService to receive current state of the dataService
     */
    dataService.subscribeEnableState(function (enabled) {
      if (enabled) {
        initTimeDeltaModel();
        initReceivedDataModel();
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

