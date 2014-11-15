'use strict';

angular.module('angularol3jsuiApp')
    .controller(
    'ObjectTableCtrl',
    [
        '$scope',
        '$interval',
        'WebsocketGeoJSONService',
        'websocketConfig',
        'olData',
        function ($scope, $interval, WebsocketGeoJSONService, websocketConfig, olData) {

            $scope.showTable = false;

            $scope.filterArea = false;

            $scope.cleanupInterval = websocketConfig.cleanupInterval; //Delete aircrafts after 15 seconds without activity

            $scope.features = {};

            var stop;

            var initialized = false;

            var geoJSONFormat = new ol.format.GeoJSON({defaultDataProjection: 'EPSG:4326'});

            var vectorSource = new ol.source.Vector({projection: 'EPSG:3857'});

            var vectorLayer = new ol.layer.Vector({
                title: "Tracks",
                source: vectorSource,
                style: (function () {

                    var textFill = new ol.style.Fill({
                        color: '#800'
                    });

                    var doublePi = 2 * Math.PI;

                    var rotationPropertyName = 'heading';
                    var labelPropertyName = 'callsign';

                    var imgSrc = 'images/aircraft.svg';
                    var imgSize = 32;
                    var halfImgSize = imgSize / 2;
                    var font = '8px Calibri,sans-serif';
                    var textAlignment = 'left';


                    function degreeToRad(feature, propertyName) {
                        return (feature.get(propertyName) / 360.0) * doublePi;
                    }


                    return function (feature) {
                        var icon = new ol.style.Icon(({
                            src: imgSrc,
                            width: imgSize,
                            rotation: degreeToRad(feature, rotationPropertyName)
                        }));

                        return [new ol.style.Style({
                            text: new ol.style.Text({
                                font: font,
                                textAlign: textAlignment,
                                text: feature.get(labelPropertyName),
                                fill: textFill,
                                offsetY: halfImgSize,
                                offsetX: halfImgSize
                            }),
                            image: icon
                        })];
                    };
                })()
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
                swiss: {
                    lat: 46.801111,
                    lon: 8.226667,
                    zoom: 7
                },
                layers: {
                    mainlayer: {
                        source: {
                            type: "OSM"
                        }
                    }
                }
            });

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

            WebsocketGeoJSONService.subscribeMessages(function (message) {
                updateRealTimePointFeature(message.data);
                $scope.showCount = true;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            });

            WebsocketGeoJSONService.subscribeWebsocketEnablement(function (enabled) {
                if (enabled) {
                    init();
                    if (!angular.isDefined(stop)) {
                        stop = $interval(function () {
                            removeOldFeatures();
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }, $scope.cleanupInterval);
                    }
                }
                else {
                    if (angular.isDefined(stop)) {
                        $interval.cancel(stop);
                        stop = undefined;
                    }
                }
            });

            /**
             * Returns the current Zulu time
             * @returns {Date} the current zulu time
             */
            $scope.currentUTCDate = function () {
                var now = new Date();
                var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
                return utc;
            };

            /**
             * Stop interval on destroy
             */
            $scope.$on('$destroy', function () {
                if (angular.isDefined(stop)) {
                    $interval.cancel(stop);
                    stop = undefined;
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
                var currentMillis = $scope.currentUTCDate();
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
             * Converts the given data as JSON if attribute already exist in $scope features the data will be updated.
             * otherwise the feature will be added to the scope
             * @param data a JSON String
             */
            function updateRealTimePointFeature(data) {
                var jsonObject = JSON.parse(data);

                if (!jsonObject.properties) {
                    jsonObject.properties = {};
                }

                jsonObject.properties.messageReceived = $scope.currentUTCDate();

                var id = jsonObject.properties.hexIdent;

                if (id) {
                    jsonObject.id = id;
                    $scope.features[id] = jsonObject;

                    if (jsonObject.geometry !== null) {
                        var geoJsonFeature = geoJSONFormat.readFeature(jsonObject, {featureProjection: 'EPSG:3857'});

                        var currentFeature = vectorSource.getFeatureById(id);
                        if (!currentFeature) {
                            currentFeature = geoJsonFeature;
                            vectorSource.addFeature(currentFeature);
                        }
                        else {
                            currentFeature.setProperties(jsonObject.properties);
                        }
                        currentFeature.setGeometry(geoJsonFeature.getGeometry());
                    }

                }
            };

        }]);
