'use strict';

/**
 * @ngdoc service
 * @name ShipStyleService
 * @description
 * # ShipStyleService
 * Implements getStyle and updateStyle to style a given feature as aircraft
 */
angular.module('angularol3jsuiApp').service('ShipStyleService', function () {

  var textFill = new ol.style.Fill({
    color: '#800'
  });

  var piToRadianFactor = (2 * Math.PI) / 360.0;

  var rotationPropertyName = 'trueHeading';
  var labelPropertyName = 'name';

  var imgSrc = 'images/ship.svg';
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
      text: getLabel(feature),
      fill: textFill,
      offsetY: halfImgSize,
      offsetX: halfImgSize
    });
  }

  function getLabel(feature) {
    //return '<a href="http://www.marinetraffic.com/de/ais/details/ships/' + feature.get(labelPropertyName) + '">' + feature.get(labelPropertyName) + '</a>';
    return feature.get(labelPropertyName);
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
  this.getStyle = function (feature) {
    return new ol.style.Style({
      text: getTextStyle(feature),
      image: getIconStyle(feature)
    });
  };

  /**
   * Updates the style of the given feature
   * if properties changed
   * @param feature the feature to update
   */
  this.updateStyle = function (feature) {
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

    //Update style only if text or icon style changed
    if (styleChanged) {
      feature.setStyle(
        new ol.style.Style({
          text: textStyle,
          image: iconStyle
        })
      );
    }
  };
});
