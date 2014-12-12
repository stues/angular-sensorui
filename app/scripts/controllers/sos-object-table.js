'use strict';

angular.module('angularol3jsuiApp')
  .controller(
  'SOSObjectTableCtrl',
  [
    '$scope',
    '$timeout',
    '$controller',
    'SOSJSONService',
    'sosConfig',
    'olData',
    function ($scope, $timeout, $controller, SOSJSONService, sosConfig, olData) {

      $scope.showTable = false;

      $scope.filterArea = false;

      //Delete aircrafts after configured amount of time
      $scope.cleanupInterval = sosConfig.cleanupInterval;

      $scope.features = {};

      //The delay after the call returned form server before the next will be send
      $scope.updateInterval = sosConfig.updateInterval;

      $scope.latestToDate;

      var stop;

      var initialized = false;

      var geoJSONFormat = new ol.format.GeoJSON({defaultDataProjection: 'EPSG:4326'});

      var vectorSource = new ol.source.Vector({projection: 'EPSG:3857'});

      var vectorLayer = new ol.layer.Vector({
        title: "Tracks",
        source: vectorSource
      });

      var filterAreaSource = new ol.source.Vector({projection: 'EPSG:3857'});
      var filterAreaLayer = new ol.layer.Vector({
        title: "Filter Area",
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

      angular.extend($scope, {
        switzerland: {
          lat: 46.801111,
          lon: 8.226667,
          zoom: 8
        },
        layers: {
          mainlayer: {
            source: {
              type: "OSM"
            }
          }
        }
      });

      var timeDeltaModel = $scope.$new();
      timeDeltaModel.deltaName = 'sosDeltas';

      $controller('TimeDeltaCtrl', {$scope: timeDeltaModel});

      /**
       * Initializes the map
       * adds the filterAreaLayer and the vectorLayer
       */
      function init() {
        if (!initialized) {
          olData.getMap().then(function (map) {
            olData.getLayers().then(function () {
              map.addLayer(filterAreaLayer);
              map.addLayer(vectorLayer);
            });
          });
        }
        initialized = true;
      }

      // Function to replicate setInterval using $timeout service.
      $scope.intervalFunction = function () {
        stop = $timeout(function () {
          removeOldFeatures();
          loadRemoteData();
          init();
        }, $scope.updateInterval)
      };

      // Kick off the interval
      $scope.intervalFunction();

      /**
       * Returns the current Zulu time
       * @returns {Date} the current zulu time
       */
      $scope.currentDate = function () {
        var now = new Date();
        //var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
        return now;
      };

      /**
       * Stop interval on destroy
       */
      $scope.$on('$destroy', function () {
        if (angular.isDefined(stop)) {
          $timeout.cancel(stop);
          stop = undefined;
        }
      });

      /**
       * Toggles between Filtering Area and no filter
       */
      $scope.toggleFilterArea = function () {
        init();
        var area;
        if (!$scope.filterArea) {
          area = sosConfig.areaFilter;
          var geoJsonFeature = geoJSONFormat.readFeature(area, {featureProjection: 'EPSG:3857'});
          geoJsonFeature.setId("filterArea");
          filterAreaSource.addFeature(geoJsonFeature);
          $scope.filterArea = true;
        }
        else {
          var featureToRemove = filterAreaSource.getFeatureById("filterArea");
          if (featureToRemove) {
            filterAreaSource.removeFeature(featureToRemove);
          }
          $scope.filterArea = false;
        }
      }

      /**
       * Update map with given entries
       * @param entries the new entries
       */
      function applyRemoteData(entries) {
        console.log(entries);
        var observations = entries.observations;

        var observationsLength = observations.length;
        for (var i = 0; i < observationsLength; i++) {
          var observation = observations[i];
          if (observation.observableProperty in sosConfig.properties) {

            var result = observation.result;

            if (!angular.isObject($scope.features[observation.featureOfInterest])) {
              $scope.features[observation.featureOfInterest] = {}
              $scope.features[observation.featureOfInterest].properties = {}
              $scope.features[observation.featureOfInterest].id = observation.featureOfInterest;
            }

            $scope.features[observation.featureOfInterest].properties.messageGenerated = new Date(observation.resultTime);
            $scope.features[observation.featureOfInterest].properties.messageReceived = $scope.currentDate();

            var propertyType = sosConfig.properties[observation.observableProperty].type;
            var propertyName = sosConfig.properties[observation.observableProperty].name;

            if (propertyType === 'number') {
              $scope.features[observation.featureOfInterest].properties[propertyName] = result.value;
            }
            else if (propertyType === 'string') {
              $scope.features[observation.featureOfInterest].properties[propertyName] = result;
            }
            else if (propertyType === 'geojson') {
              $scope.features[observation.featureOfInterest][propertyName] = result;
            }

            updateRealTimePointFeature($scope.features[observation.featureOfInterest]);
          }
        }
        //$scope.features = observations;
        $scope.intervalFunction();
      }

      /**
       * Performs the loading of new data
       */
      function loadRemoteData() {
        var fromDate;
        if (angular.isObject($scope.latestToDate)) {
          fromDate = $scope.latestToDate;
        }
        else {
          fromDate = new Date();
          fromDate = new Date(fromDate.getTime() - $scope.updateInterval);
        }
        var toDate = new Date();
        $scope.latestToDate = toDate;
        if ($scope.filterArea) {
          SOSJSONService.getNewEntriesWithinFilterArea(fromDate, toDate, sosConfig.areaFilter)
            .then(function (entries) {
              applyRemoteData(entries);
            }
          );
        }
        else {
          SOSJSONService.getNewEntries(fromDate, toDate)
            .then(function (entries) {
              applyRemoteData(entries);
            }
          );
        }
      }

      /**
       * Removes all features which are older than a given delay
       */
      function removeOldFeatures() {
        var currentMillis = $scope.currentDate();
        var currentSeconds = currentMillis - $scope.cleanupInterval;
        for (var id in $scope.features) {
          var feature = $scope.features[id];
          var featureSeenDate = feature.properties.messageReceived;
          if (currentSeconds > featureSeenDate) {
            delete $scope.features[id];
            var featureToRemove = vectorSource.getFeatureById(id);
            if (featureToRemove) {
              vectorSource.removeFeature(featureToRemove);
            }
          }
        }
      }

      /**
       *
       * @param {Array}
       * @returns OpenLayers.Feature.Vector
       */
      function updateRealTimePointFeature(object) {
        var id = object.id;

        if (id) {

          if (object.geometry) {
            var geoJsonFeature = geoJSONFormat.readFeature(object, {featureProjection: 'EPSG:3857'});
            var currentFeature = vectorSource.getFeatureById(id);
            if (!currentFeature) {
              currentFeature = geoJsonFeature;
              currentFeature.setStyle(getStyle(currentFeature));
              vectorSource.addFeature(currentFeature);
            }
            else {
              currentFeature.setProperties(object.properties);
              updateStyle(currentFeature);
            }
            currentFeature.setGeometry(geoJsonFeature.getGeometry());
          }

          timeDeltaModel.addDelta(object.properties.messageGenerated, object.properties.messageReceived);
        }
      };

      /*
       * The Following part contains the styling methods
       */

      var textFill = new ol.style.Fill({
        color: '#800'
      });

      var piToRadianFactor = (2 * Math.PI) / 360.0;

      var rotationPropertyName = 'heading';
      var labelPropertyName = 'callsign';

      var imgSrc = 'images/aircraft.svg';
      var imgSize = 32;
      var halfImgSize = imgSize / 2;
      var font = '8px Calibri,sans-serif';
      var textAlignment = 'left';

      /**
       * Returns the Textstyle for the given Feature
       * @param feature the feature
       * @returns {ol.style.Text} the text style
       */
      function getTextStyle(feature) {
        return new ol.style.Text({
          font: font,
          textAlign: textAlignment,
          text: feature.get(labelPropertyName),
          fill: textFill,
          offsetY: halfImgSize,
          offsetX: halfImgSize
        })
      }

      /**
       * Converts the property of the given feature from degree to radian
       * @param feature the feature
       * @param propertyName the name of the property to convert
       * @returns {number} the property value in radian
       */
      function degreeToRad(feature, propertyName) {
        return feature.get(propertyName) * piToRadianFactor;
      }

      /**
       * Returns the icon style for the given feature
       * @param feature the feature
       * @returns {ol.style.Icon} the icon for the given feature
       */
      function getIconStyle(feature) {
        return new ol.style.Icon({
          src: imgSrc,
          width: imgSize,
          rotation: degreeToRad(feature, rotationPropertyName)
        });
      }

      /**
       * Returns the style for the given Feature
       * The style contains a text and a icon style
       * @param feature the feature
       * @returns {ol.style.Style} the style for the given feature
       */
      function getStyle(feature) {
        return new ol.style.Style({
          text: getTextStyle(feature),
          image: getIconStyle(feature)
        });
      }

      /**
       * Updates the style of the given feature
       * if properties changed
       * @param feature the feature to update
       */
      function updateStyle(feature) {
        var styleChanged = false;

        var style = feature.getStyle();
        var iconStyle = style.getImage();
        if (iconStyle.getRotation() !== degreeToRad(feature, rotationPropertyName)) {
          iconStyle = getIconStyle(feature);
          styleChanged = true;
        }

        var textStyle = style.getText();
        if (textStyle.getText() !== feature.get(labelPropertyName)) {
          textStyle = getTextStyle(feature);
          styleChanged = true;
        }

        //Update style if text or icon style changed
        if(styleChanged){
          feature.setStyle(
            new ol.style.Style({
              text: textStyle,
              image: iconStyle
            })
          );
        }
      }

    }]);
