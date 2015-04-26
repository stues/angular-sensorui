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

    $scope.filterArea = false;

    $scope.cleanupInterval = undefined;

    $scope.lastSeenUpdate = undefined;

    $scope.initialized = false;

    $scope.featureValues = {};

    var geoJSONFormat = new ol.format.GeoJSON({
      defaultDataProjection: implementationConfig.dataProjection
    });

    $scope.featureSource = new ol.source.Vector({
      projection: mapConfig.mapProjection
    });

    var featureLayer = new ol.layer.Vector({
      title: implementationConfig.featureLayerName,
      source: $scope.featureSource
    });

    var filterAreaSource = new ol.source.Vector({projection: mapConfig.mapProjection});
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

    var featureAttributes = {
      dataProjection: implementationConfig.dataProjection,
      featureProjection: mapConfig.mapProjection
    };

    var timeDeltaModel = $scope.$new();
    timeDeltaModel.deltaName = implementationConfig.timeDeltaName;

    $controller('TimeDeltaCtrl', {$scope: timeDeltaModel});

    /**
     * Initializes the map
     * adds the filterAreaLayer and the featureLayer
     */
    function initFeatureLayers() {
      if (!$scope.initialized) {
        olData.getMap().then(function (map) {
          map.addLayer(filterAreaLayer);
          map.addLayer(featureLayer);
        });
      }
      $scope.initialized = true;
    }

    /**
     * The index of the last Seen property
     * @returns {number|*|i}
     */
    function getLastSeenIndex() {
      if (!angular.isDefined($scope.lastSeenIndex)) {
        var displayProperties = mapConfig.displayProperties;
        var displayPropertiesLength = displayProperties.length;
        for (var i = 0; i < displayPropertiesLength; i++) {
          if (displayProperties[i].property === 'lastSeen') {
            $scope.lastSeenIndex = i;
            break;
          }
        }
      }
      return $scope.lastSeenIndex;
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
     * Updates the $scope.featureValues for the given feature
     * @param feature the feature
     */
    $scope.updateFeatureDisplayProperties = function (feature, geometry) {
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
            if (geometry) {
              valueToAdd = Math.round(geometry.coordinates[1]*100)/100;
            }
          }
          else if (displayProperty === 'pointLon') {
            if (geometry) {
              valueToAdd = Math.round(geometry.coordinates[0]*100)/100;
            }
          }
          else if (properties[displayProperty]) {
            valueToAdd = properties[displayProperty];
          }

          if (valueToAdd) {
            featureValues[i] = valueToAdd;
          }
          else if(!featureValues[i]){
            featureValues[i] = '';
          }
        }
      }
    };

      /**
       * Starts the cleanup interval
       */
      $scope.startCleanupInterval = function () {
        if (!angular.isDefined($scope.cleanupInterval)) {
          $scope.cleanupInterval = $interval(function () {
            $scope.removeOldFeatures();
          }, implementationConfig.cleanupInterval);
        }

        if (!angular.isDefined($scope.lastSeenUpdate)) {
          $scope.lastSeenUpdate = $interval(function () {
            $scope.updateLastSeen()
          }, mapConfig.lastSeenUpdateInterval);
        }
      };

    $scope.updateLastSeen = function(){
      $scope.featureSource.forEachFeature(function (feature) {
        var id = feature.getId();
        if ($scope.featureValues[id]) {
          var featureValues = $scope.featureValues[id];

          var deltaInSeconds = (new Date() - (feature.getProperties().messageReceived - 1))/ 1000;
          featureValues[getLastSeenIndex()] = Math.round(deltaInSeconds) + 's';
        }
      });
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    }

      /**
       * Stops the cleanup interval
       */
      $scope.stopCleanupInterval = function () {
        if (angular.isDefined($scope.cleanupInterval)) {
          $interval.cancel($scope.cleanupInterval);
          $scope.cleanupInterval = undefined;
        }

        if (angular.isDefined($scope.lastSeenUpdate)) {
          $interval.cancel($scope.lastSeenUpdate);
          $scope.lastSeenUpdate = undefined;
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
        var currentSeconds = currentMillis - implementationConfig.cleanupInterval;
        $scope.featureSource.forEachFeature(function (feature) {
          var featureSeenDate = feature.getProperties().messageReceived;
          if (currentSeconds > featureSeenDate) {
            $scope.featureSource.removeFeature(feature);
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
          var currentFeature = $scope.featureSource.getFeatureById(id);
          if (!currentFeature) {
            if (object.geometry) {
              var geoJsonFeature = geoJSONFormat.readFeature(object, featureAttributes);
              currentFeature = geoJsonFeature;
            }
            else {
              currentFeature = new ol.Feature();
              currentFeature.setId(id);
              currentFeature.setProperties(object.properties);
            }
            currentFeature.setStyle(FeatureStyleService.getStyle(currentFeature));
            $scope.featureSource.addFeature(currentFeature);
          }
          else {
            var properties = currentFeature.getProperties();
            $.extend(true, properties, object.properties);
            currentFeature.setProperties(properties);
            if (object.geometry) {
              var geometry = geoJSONFormat.readGeometry(object.geometry, featureAttributes);
              currentFeature.setGeometry(geometry);
            }
            FeatureStyleService.updateStyle(currentFeature);
          }

          $scope.updateFeatureDisplayProperties(currentFeature, object.geometry);
          timeDeltaModel.addDelta(object.properties.messageGenerated, object.properties.messageReceived);
        }
      };

      /**
       * Toggles between Filtering Area and no filter
       */
      $scope.toggleFilterArea = function () {
        initFeatureLayers();
        var area;
        if (!$scope.filterArea) {
          area = implementationConfig.areaFilter;
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
       * Update the $scope.featureSource with given data
       * @param features the new values
       */
      $scope.applyRemoteData = function (features) {
        for (var featureId in features) {
          if (features.hasOwnProperty(featureId)) {
            $scope.updateRealTimePointFeature(features[featureId]);
          }
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
       * Do Subscribe on service to receive messages
       */
      service.subscribeMessages(function (message) {
        $scope.applyRemoteData(message);
      });

      /**
       * Do subscribe on service to receive current state of the service
       */
      service.subscribeEnableState(function (enabled) {
        if (enabled) {
          initFeatureLayers();
          $scope.startCleanupInterval();
        }
        else {
          $scope.stopCleanupInterval();
        }
      });
    }
    )
    ;

