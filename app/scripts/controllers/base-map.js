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
      olCenter: mapConfig.olCenter,
      olBackgroundLayer: mapConfig.olBackgroundLayer,
      olDefaults: mapConfig.olDefaults
    });

    $scope.showTable = false;

    $scope.featureValues = {};

    $scope.filterArea = false;


    var initialized = false;

    var cleanupInterval;

    var tableAttributesUpdateInterval;

    var lastSeenIndex;

    var geoJSONFormat = new ol.format.GeoJSON({
      defaultDataProjection: implementationConfig.dataProjection
    });

    var featureSource = new ol.source.Vector({
      projection: mapConfig.mapProjection
    });

    var featureAttributes = {
      dataProjection: implementationConfig.dataProjection,
      featureProjection: mapConfig.mapProjection
    };

    var featureLayer = new ol.layer.Vector({
      title: implementationConfig.featureLayerName,
      source: featureSource
    });

    var timeDeltaController;

    var filterAreaController;

    /**
     * Watch the show table attribute, if set, enable update of the table
     */
    $scope.$watch('showTable', function (newValue) {
      if (newValue) {
        updateAllTableAttributes();
        if (!angular.isDefined(tableAttributesUpdateInterval)) {
          tableAttributesUpdateInterval = $interval(function () {
            updateLastSeenTableAttributes();
          }, mapConfig.tableAttributesInterval);
        }
      }
      else {
        if (angular.isDefined(tableAttributesUpdateInterval)) {
          $interval.cancel(tableAttributesUpdateInterval);
          tableAttributesUpdateInterval = undefined;
        }
      }
    });

    /**
     * Watch the filterArea attribute, if true initialize filter area controller
     * and notify controller
     */
    $scope.$watch('filterArea', function (newValue) {

      if (newValue) {
        initFilterAreaController();
      }
      if(filterAreaController){
        filterAreaController.setFilterArea(newValue);
      }
    });

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
     * Initializes the filter area controller
     */
    function initFilterAreaController() {
      if (!filterAreaController) {
        filterAreaController = $scope.$new();
        filterAreaController.service = service;
        filterAreaController.filterAreaConfig = implementationConfig.filterArea;
        filterAreaController.geoJSONFormat = geoJSONFormat;
        $controller('FilterAreaCtrl', {$scope: filterAreaController});
      }
    }



    /**
     * Iterates over all features and updates the last seen attribute ond the featureValues to display
     * After that initiating rendering
     */
    function updateAllTableAttributes() {
      if ($scope.showTable) {
        featureSource.forEachFeature(function (feature) {
          updateFeatureDisplayProperties(feature);
        });
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      }
    }

    /**
     * The index of the last Seen property
     * @returns {number|*|i}
     */
    function getLastSeenIndex() {
      if (!angular.isDefined(lastSeenIndex)) {
        var displayProperties = mapConfig.displayProperties;
        var displayPropertiesLength = displayProperties.length;
        for (var i = 0; i < displayPropertiesLength; i++) {
          if (displayProperties[i].property === 'lastSeen') {
            lastSeenIndex = i;
            break;
          }
        }
      }
      return lastSeenIndex;
    }

    /**
     * Iterates over all features and updates the last seen attribute ond the featureValues to display
     * After that initiating rendering
     */
    function updateLastSeenTableAttributes() {
      if ($scope.showTable) {
        featureSource.forEachFeature(function (feature) {
          updateLastSeenOnFeature(feature);
        });
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      }
    }

    /**
     * Updates the last seen property within the $scope.featureValues
     * @param feature the feature to update
     */
    function updateLastSeenOnFeature(feature) {
      var id = feature.getId();
      if ($scope.featureValues[id]) {
        var featureValues = $scope.featureValues[id];

        var deltaInSeconds = (new Date() - (feature.get('messageReceived') - 1)) / 1000;
        featureValues[getLastSeenIndex()] = Math.round(deltaInSeconds * 100) / 100 + 's';
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
     * Updates the $scope.featureValues for the given feature
     * @param feature the feature
     */
    function updateFeatureDisplayProperties(feature) {
      var id = feature.getId();
      var featureValues;
      if ($scope.featureValues[id]) {
        featureValues = $scope.featureValues[id];
      }
      else {
        featureValues = [];
        $scope.featureValues[id] = featureValues;
      }

      if (feature) {
        var properties = feature.getProperties();
        var displayProperties = mapConfig.displayProperties;
        var displayPropertiesLength = displayProperties.length;
        var valueToAdd;
        for (var i = 0; i < displayPropertiesLength; i++) {
          valueToAdd = undefined;
          var displayProperty = displayProperties[i].property;
          if (displayProperty === 'id') {
            valueToAdd = feature.getId();
          }
          else if (displayProperty === 'pointLat') {
            if (properties.receivedGeometry) {
              valueToAdd = Math.round(properties.receivedGeometry.coordinates[1] * 100) / 100;
            }
          }
          else if (displayProperty === 'pointLon') {
            if (properties.receivedGeometry) {
              valueToAdd = Math.round(properties.receivedGeometry.coordinates[0] * 100) / 100;
            }
          }
          else if (properties[displayProperty]) {
            valueToAdd = properties[displayProperty];
          }

          if (valueToAdd) {
            featureValues[i] = valueToAdd;
          }
          else if (!featureValues[i]) {
            featureValues[i] = '';
          }
        }
      }
    }

    /**
     * Returns the Labels for the configured Attributes
     * @returns {Array}
     */
    $scope.getFeaturePropertyLabels = function () {
      var labels = [];
      var displayProperties = mapConfig.displayProperties;
      var displayPropertiesLength = displayProperties.length;
      for (var i = 0; i < displayPropertiesLength; i++) {
        labels.push(displayProperties[i].label);
      }
      return labels;
    };

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
          delete $scope.featureValues[feature.getId()];
        }
      });
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
            var geoJsonFeature = geoJSONFormat.readFeature(object, featureAttributes);
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
        }
        else {
          var properties = currentFeature.getProperties();
          $.extend(true, properties, object.properties);
          currentFeature.setProperties(properties);
          if (object.geometry) {
            var geometry = geoJSONFormat.readGeometry(object.geometry, featureAttributes);
            currentFeature.setGeometry(geometry);
            currentFeature.set('receivedGeometry', object.geometry);
          }
          FeatureStyleService.updateStyle(currentFeature);
        }

        updateFeatureDisplayProperties(currentFeature);
        timeDeltaController.addDelta(object.properties.messageGenerated, object.properties.messageReceived);
      }
    };

    /**
     * Returns the current date
     * @returns {Date} the current date
     */
    $scope.currentDate = function () {
      return new Date();
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

