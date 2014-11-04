'use strict';

angular.module('angularol3jsuiApp')
    .controller(
    'ObjectTableCtrl',
    [
        '$scope',
        '$interval',
        'WebsocketGeoJSONService', 'olData',
        function ($scope, $interval, WebsocketGeoJSONService, olData) {

            var stop;

            var initialized = false;

            var geoJSONFormat = new ol.format.GeoJSON({defaultDataProjection:'EPSG:4326'});

            var vectorSource = new ol.source.Vector({projection:'EPSG:3857'});

            var vectorLayer = new ol.layer.Vector({
                title: "Tracks",
                source: vectorSource,
                style: (function () {

                    var textFill = new ol.style.Fill({
                        color: '#800'
                    });

                    var doublePi = 2 * Math.PI;

                    var rotationPropertyName = 'track';
                    var labelPropertyName = 'callsign';

                    var imgSrc = 'images/aircraft.svg';
                    var imgSize = 32;
                    var halfImgSize = imgSize/2;
                    var font = '8px Calibri,sans-serif';
                    var textAlignment = 'left';


                    function degreeToRad(feature, propertyName){
                        return (feature.get(propertyName)/360.0) * doublePi;
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

            $scope.maxLastSeen = 15000; //Delete aircrafts after 15 seconds

            $scope.features = {};

            function init(){
                if(!initialized) {
                    olData.getMap().then(function (map) {
                        olData.getLayers().then(function () {
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
                if(enabled){
                    init();
                    if (!angular.isDefined(stop)) {
                        stop = $interval(function () {
                            removeOldFeatures();
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }, $scope.maxLastSeen);
                    }
                }
                else{
                    if (angular.isDefined(stop)) {
                        $interval.cancel(stop);
                        stop = undefined;
                    }
                }
            });

            $scope.currentUTCDate = function () {
                var now = new Date();
                var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
                return utc;
            };

            $scope.$on('$destroy', function () {
                if (angular.isDefined(stop)) {
                    $interval.cancel(stop);
                    stop = undefined;
                }
            });

            /**
             * Removes all features which are older than a given
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
            function updateRealTimePointFeature(data) {
                var jsonObject = JSON.parse(data);

                if(!jsonObject.properties){
                    jsonObject.properties = {};
                }

                jsonObject.properties.messageReceived = $scope.currentUTCDate();

                var id = jsonObject.properties.hexIdent;

                if (id) {
                    $scope.features[id] = jsonObject;

                    if (jsonObject.geometry !== null) {
                        jsonObject.id = id;
                        var geoJsonFeature = geoJSONFormat.readFeature(jsonObject, {featureProjection:'EPSG:3857'});

                        var currentFeature = vectorSource.getFeatureById(id);
                        if (!currentFeature) {
                            currentFeature = geoJsonFeature;
                            vectorSource.addFeature(currentFeature);
                        }
                        else{
                            currentFeature.setProperties(jsonObject.properties);
                        }
                        currentFeature.setGeometry(geoJsonFeature.getGeometry());
                    }

                }
            };

        } ]);
