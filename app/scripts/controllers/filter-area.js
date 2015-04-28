'use strict';

/**
 * @ngdoc function
 * @name angularol3jsuiApp.controller:FilterAreaCtrl
 * @description
 * # FilterAreaCtrl
 * This Controller can be used to filter tracks within a configured area
 */
angular.module('angularol3jsuiApp')
  .controller(
  'FilterAreaCtrl',
  [
    '$scope',
    'mapConfig',
    'olData',
    function ($scope, mapConfig, olData) {
      var featureAttributes = {
        dataProjection: $scope.filterAreaConfig.dataProjection,
        featureProjection: mapConfig.mapProjection
      };

      //Initialize Filter Area Source and Layer
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

      // Add Filter Area Layer to Map
      olData.getMap().then(function (map) {
        map.addLayer(filterAreaLayer);
      });

      /**
       * Toggles between Filtering Area and no filter
       */
      $scope.setFilterArea = function (enabled) {
        var area;
        if (enabled) {
          area = $scope.filterAreaConfig.areaFilter;
          var geoJsonFeature = $scope.geoJSONFormat.readFeature(area, featureAttributes);
          geoJsonFeature.setId('filterArea');
          filterAreaSource.addFeature(geoJsonFeature);
        }
        else {
          area = undefined;
          var featureToRemove = filterAreaSource.getFeatureById('filterArea');
          if (featureToRemove) {
            filterAreaSource.removeFeature(featureToRemove);
          }
        }
        $scope.service.setFilterArea(area);
      };
    }]);
