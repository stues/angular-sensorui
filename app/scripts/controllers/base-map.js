'use strict';

function BaseMapController($scope, $interval, $controller, config, olData) {

  $scope.showTable = false;

  $scope.filterArea = false;

  $scope.cleanupInterval;

  $scope.features = {};

  $scope.initialized = false;

  $scope.geoJSONFormat = new ol.format.GeoJSON({defaultDataProjection: 'EPSG:4326'});

  $scope.vectorSource = new ol.source.Vector({projection: 'EPSG:3857'});

  $scope.vectorLayer = new ol.layer.Vector({
    title: "Tracks",
    source: $scope.vectorSource
  });

  $scope.filterAreaSource = new ol.source.Vector({projection: 'EPSG:3857'});
  $scope.filterAreaLayer = new ol.layer.Vector({
    title: "Filter Area",
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
        type: "OSM"
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
      olData.getMap().then(function(map) {
        map.addLayer($scope.filterAreaLayer);
        map.addLayer($scope.vectorLayer);
      });
    }
    $scope.initialized = true;
  }

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
  }

  /**
   * Stops the cleanup interval
   */
  $scope.stopCleanupInterval = function () {
    if (angular.isDefined($scope.cleanupInterval)) {
      $interval.cancel($scope.cleanupInterval);
      $scope.cleanupInterval = undefined;
    }
  }

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
    var currentMillis = $scope.currentDate();
    var currentSeconds = currentMillis - config.cleanupInterval;
    var i = 0;
    for (var id in $scope.features) {
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
    console.log("Amount of Features:", i);
  }

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
  $scope.getStyle = function (feature) {
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
  $scope.updateStyle = function (feature) {
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

};
