'use strict';

angular.module('angularol3jsuiApp')
  .controller(
  'ObjectTableCtrl',
  [
    '$scope',
    '$interval',
    '$controller',
    'WebsocketGeoJSONService',
    'websocketConfig',
    'olData',
    function ($scope, $interval, $controller, WebsocketGeoJSONService, websocketConfig, olData) {

      $scope.showTable = false;

      $scope.filterArea = false;

      //Delete aircraft after configured amount of time
      $scope.cleanupInterval = websocketConfig.cleanupInterval;

      $scope.features = {};

      var cleanupInterval;

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
          zoom: 7
        },
        backgroundLayer: {
          source: {
            type: "OSM"
          }
        }
      });


      var timeDeltaModel = $scope.$new();
      timeDeltaModel.deltaName = 'websocketDeltas';

      $controller('TimeDeltaCtrl', {$scope: timeDeltaModel});

      /**
       * Initializes the map
       * adds the filterAreaLayer and the vectorLayer
       */
      function init() {
        if (!initialized) {
          olData.getMap().then(function (map) {
            map.addLayer(filterAreaLayer);
            map.addLayer(vectorLayer);
          });
        }
        initialized = true;
      }

      WebsocketGeoJSONService.subscribeMessages(function (message) {
        updateRealTimePointFeature(message.data);
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      });

      WebsocketGeoJSONService.subscribeEnablement(function (enabled) {
        if (enabled) {
          init();
          if (!angular.isDefined(cleanupInterval)) {
            cleanupInterval = $interval(function () {
              removeOldFeatures();
              if (!$scope.$$phase) {
                $scope.$apply();
              }
            }, $scope.cleanupInterval);
          }
        }
        else {
          if (angular.isDefined(cleanupInterval)) {
            $interval.cancel(cleanupInterval);
            cleanupInterval = undefined;
          }
        }
      });

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
       * Cleanup interval on destroy
       */
      $scope.$on('$destroy', function () {
        if (angular.isDefined(cleanupInterval)) {
          $interval.cancel(cleanupInterval);
          cleanupInterval = undefined;
        }
      });

      /**
       * Toggles between Filtering Area and no filter
       */
      $scope.toggleFilterArea = function () {
        init();
        var message;
        if (!$scope.filterArea) {
          message = websocketConfig.areaFilter;
          var geoJsonFeature = geoJSONFormat.readFeature(message, {featureProjection: 'EPSG:3857'});
          geoJsonFeature.setId("filterArea");
          filterAreaSource.addFeature(geoJsonFeature);
          $scope.filterArea = true;
        }
        else {
          message = websocketConfig.clearFilter;
          var featureToRemove = filterAreaSource.getFeatureById("filterArea");
          if (featureToRemove) {
            filterAreaSource.removeFeature(featureToRemove);
          }
          $scope.filterArea = false;
        }
        WebsocketGeoJSONService.sendMessage(JSON.stringify(message));
      }

      /**
       * Removes all features which are older than a given range
       */
      function removeOldFeatures() {
        var currentMillis = $scope.currentDate();
        var currentSeconds = currentMillis - $scope.cleanupInterval;
        var i = 0;
        for (var id in $scope.features) {
          i++;
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
        console.log("Amount of Features:", i);
      }

      /**
       * Converts the given data as JSON if attribute already exist in $scope features the data will be updated.
       * otherwise the feature will be added to the scope
       * @param data a JSON String
       */
      function updateRealTimePointFeature(data) {
        var jsonObject = JSON.parse(data);

        if (!jsonObject.properties) {
          jsonObject.properties = {};
        }
        else {
          if (jsonObject.properties.messageGenerated) {
            jsonObject.properties.messageGenerated = new Date(jsonObject.properties.messageGenerated);
          }
        }

        jsonObject.properties.messageReceived = $scope.currentDate();

        var id = jsonObject.properties.hexIdent;

        if (id) {
          jsonObject.id = id;
          $scope.features[id] = jsonObject;


          if (jsonObject.geometry !== null) {
            var geoJsonFeature = geoJSONFormat.readFeature(jsonObject, {featureProjection: 'EPSG:3857'});

            var currentFeature = vectorSource.getFeatureById(id);
            if (!currentFeature) {
              currentFeature = geoJsonFeature;
              currentFeature.setStyle(getStyle(currentFeature));
              vectorSource.addFeature(currentFeature);
            }
            else {
              currentFeature.setProperties(jsonObject.properties);
              updateStyle(currentFeature);
            }
            currentFeature.setGeometry(geoJsonFeature.getGeometry());
          }

          timeDeltaModel.addDelta(jsonObject.properties.messageGenerated, jsonObject.properties.messageReceived);
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
        console.log(feature.get(propertyName));
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
        if (styleChanged) {
          feature.setStyle(
            new ol.style.Style({
              text: textStyle,
              image: iconStyle
            })
          );
        }
      }

    }]);
