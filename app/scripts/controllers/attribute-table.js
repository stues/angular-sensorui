'use strict';

/**
 * @ngdoc function
 * @name angularol3jsuiApp.controller:FilterAreaCtrl
 * @description
 * # FilterAreaCtrl
 * This Controller can be used to update a variable which is used to display a table
 */
angular.module('angularol3jsuiApp')
  .controller(
  'AttributeTableCtrl',
  [
    '$scope',
    '$interval',
    'mapConfig',
    function ($scope, $interval, mapConfig) {

      var tableAttributesUpdateInterval;

      var lastSeenIndex;

      $scope.featureValues = {};

      $scope.showTable = false;

      var addedFeatureListener;
      var updateFeatureListener;
      var removedFeatureListener;

      /**
       * Watch the show table attribute, if set, enable update of the table
       */
      $scope.$watch('showTable', function (newValue) {
        $scope.setShowTable(newValue);
      });

      /**
       * Watch the show table attribute, if set, enable update of the table
       */
      $scope.setShowTable = function (newValue) {
        if (newValue) {
          registerListeners();
          updateAllTableAttributes();
          if (!angular.isDefined(tableAttributesUpdateInterval)) {
            tableAttributesUpdateInterval = $interval(function () {
              updateLastSeenTableAttributes();
            }, mapConfig.tableAttributesInterval);
          }
        }
        else {
          deregisterListeners();
          if (angular.isDefined(tableAttributesUpdateInterval)) {
            $interval.cancel(tableAttributesUpdateInterval);
            tableAttributesUpdateInterval = undefined;
          }
        }
      };

      /**
       * Can be called to remove a given feature from the table
       * @param event the broadcast event
       * @param removedFeature the removed feature
       */
      var removeFeatureCallback = function (event, removedFeature) {
        if (removedFeature) {
          delete $scope.featureValues[removedFeature.getId()];
        }
      };

      /**
       * Can be called to add or update a given feature on the table
       * @param event the broadcast event
       * @param changedFeature the changed feature
       */
      var updateFeatureCallback = function (event, changedFeature) {
        if ($scope.showTable && changedFeature) {
          $scope.updateFeatureDisplayProperties(changedFeature);
        }
      };

      /**
       * Register to parent feature broadcast
       */
      function registerListeners() {
        addedFeatureListener = $scope.$parent.$on('featureAdded', updateFeatureCallback);
        updateFeatureListener = $scope.$parent.$on('featureChanged', updateFeatureCallback);
        removedFeatureListener = $scope.$parent.$on('featureRemoved', removeFeatureCallback);
      }

      /**
       * Deregister from parent feature broadcast
       */
      function deregisterListeners() {
        if (addedFeatureListener) {
          addedFeatureListener();
        }
        if (updateFeatureListener) {
          updateFeatureListener();
        }
        if (removedFeatureListener) {
          removedFeatureListener();
        }
      }

      /**
       * Iterates over all features and updates the last seen attribute ond the featureValues to display
       * After that initiating rendering
       */
      function updateAllTableAttributes() {
        //Clear the object
        for (var feature in $scope.featureValues) delete $scope.featureValues[feature];

        //Add all Features
        $scope.$parent.forEachFeature(function (feature) {
          $scope.updateFeatureDisplayProperties(feature);
        });
        if (!$scope.$$phase) {
          $scope.$apply();
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
        $scope.$parent.forEachFeature(function (feature) {
          updateLastSeenOnFeature(feature);
        });
        if (!$scope.$$phase) {
          $scope.$apply();
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
      $scope.updateFeatureDisplayProperties = function (feature) {
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
      };

      /**
       * Returns the current date
       * @returns {Date} the current date
       */
      $scope.currentDate = function () {
        return new Date();
      };

    }
  ])
;
