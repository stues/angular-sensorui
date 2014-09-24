'use strict';

/**
 * @ngdoc function
 * @name angularol3jsuiApp.controller:MapCtrl
 * @description
 * # MapCtrl
 * Controller of the angularol3jsuiApp
 */
angular.module('angularol3jsuiApp')
    .controller('MapCtrl', [ '$scope', '$interval', 'WebsocketGeoJSONService', 'olData', function ($scope, $interval, WebsocketGeoJSONService, olData) {

        var stop;

        var geoJSONformat = new ol.format.GeoJSON();

        var vectorSource = new ol.source.Vector();

        var vectorLayer = new ol.layer.Vector({
            title: "Tracks",
            source: vectorSource,
            style: (function () {
                var textFill = new ol.style.Fill({
                    color: '#000'
                });

                return function (feature) {

                    var icon = new ol.style.Icon(({
                        src: 'images/airplane.png',
                        rotation: 180-feature.get('track')
                    }));


                    return [new ol.style.Style({
                        text: new ol.style.Text({
                            font: '8px Calibri,sans-serif',
                            text: feature.get('callsign'),
                            fill: textFill
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

        $scope.status = WebsocketGeoJSONService.connectionStatus;
        $scope.connectCommandLabel = WebsocketGeoJSONService
            .getNextOperationLabel();

        $scope.showCount = false;
        $scope.messageCount = WebsocketGeoJSONService
            .getMessageCount();

        WebsocketGeoJSONService.subscribeStatus(function (message) {
            $scope.status = message;
        });

        WebsocketGeoJSONService
            .subscribeWebsocketEnablement(function () {
                $scope.connectCommandLabel = WebsocketGeoJSONService
                    .getNextOperationLabel();
            });

        WebsocketGeoJSONService.subscribeMessages(function (message) {
            updateRealTimePointFeature(message.data);
            $scope.showCount = true;
            $scope.messageCount = WebsocketGeoJSONService
                .getMessageCount();
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

        $scope.connect = function () {
            if (!WebsocketGeoJSONService.isConnected()) {
                WebsocketGeoJSONService.connect();


                olData.getMap().then(function (map) {
                    olData.getLayers().then(function (layers) {
                        map.addLayer(vectorLayer);
                    });
                });


                if (!angular.isDefined(stop)) {
                    stop = $interval(function () {
                        removeOldFeatures();
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }, 15000);
                }
                $scope.connectCommandLabel = 'Disconnect';
            } else {
                WebsocketGeoJSONService.disconnect();

                if (angular.isDefined(stop)) {
                    $interval.cancel(stop);
                    stop = undefined;
                }

                $scope.showCount = false;
                $scope.connectCommandLabel = 'Connect';
            }
            $scope.messageCount = WebsocketGeoJSONService
                .getMessageCount();
        };

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
            var currentmillis = $scope.currentUTCDate();
            var currentseconds = currentmillis - $scope.maxLastSeen;
            var features = vectorSource.getFeatures();
            for (var feature in features) {
                console.log(feature);
                var featureSeenDate = feature.get('messageGenerated');
                if (currentseconds > featureSeenDate) {
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

            var id = jsonObject.properties.hexIdent;

            if (id !== null) {

                if (jsonObject.geometry !== null) {
                    jsonObject.id = id;
                    var geoJsonFeature = geoJSONformat.readFeature(jsonObject);

                    var currentFeature = vectorSource.getFeatureById(id);
                    if (!currentFeature) {
                        currentFeature = geoJsonFeature;
                        vectorSource.addFeature(currentFeature);
                    }
                    currentFeature.setGeometry(new ol.geom.Point(ol.proj.transform(geoJsonFeature.getGeometry().flatCoordinates, 'EPSG:4326',
                        'EPSG:3857')));
                }

            }
        };
}])
;
