'use strict';

angular.module('angularol3jsuiApp')
    .controller(
    'SOSObjectTableCtrl',
    [
        '$scope',
        '$timeout',
        'SOSJSONService',
        'sosConfig',
        'olData',
        function ($scope, $timeout, SOSJSONService, sosConfig, olData) {

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

            $scope.maxLastSeen = 15000; //Delete aircrafts after 15 seconds

            $scope.features = {};

            $scope.updateInterval = 3000; //Update aircrafts every 3 seconds

            $scope.latestToDate;

            function init() {
                if (!initialized) {
                    olData.getMap().then(function (map) {
                        olData.getLayers().then(function () {
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

            $scope.currentUTCDate = function () {
                var now = new Date();
                var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
                return utc;
            };

            $scope.$on('$destroy', function () {
                if (angular.isDefined(stop)) {
                    $timeout.cancel(stop);
                    stop = undefined;
                }
            });

            function applyRemoteData(entries) {
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

                        $scope.features[observation.featureOfInterest].properties.messageReceived = $scope.currentUTCDate();

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
                SOSJSONService.getNewEntries(fromDate, toDate)
                    .then(
                    function (entries) {

                        applyRemoteData(entries);

                    }
                );
            }

            /**
             * Removes all features which are older than a given delay
             */
            function removeOldFeatures() {
                var currentMillis = $scope.currentUTCDate();
                var currentSeconds = currentMillis - $scope.maxLastSeen;
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
                            vectorSource.addFeature(currentFeature);
                        }
                        else{
                            currentFeature.setProperties(object.properties);
                        }
                        currentFeature.setGeometry(geoJsonFeature.getGeometry());
                    }
                }
            };
        }]);
