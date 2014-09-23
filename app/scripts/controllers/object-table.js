'use strict';

angular.module('angularol3jsuiApp')
    .controller(
    "ObjectTableCtrl",
    [
        '$scope',
        "$interval",
        "WebsocketGeoJSONService",
        function ($scope, $interval, WebsocketGeoJSONService) {
            var stop = undefined;

            $scope.maxLastSeen = 15; //Delete aircrafts after 15 seconds

            $scope.status = WebsocketGeoJSONService.connectionStatus;
            $scope.connectCommandLabel = WebsocketGeoJSONService
                .getNextOperationLabel();

            $scope.showCount = false;
            $scope.messageCount = WebsocketGeoJSONService
                .getMessageCount();
            $scope.features = {};

            WebsocketGeoJSONService.subscribeStatus(function (message) {
                $scope.status = message;
            });

            WebsocketGeoJSONService
                .subscribeWebsocketEnablement(function (websocketEnablement) {
                    $scope.connectCommandLabel = WebsocketGeoJSONService
                        .getNextOperationLabel();
                });

            WebsocketGeoJSONService.subscribeMessages(function (message) {
                updateRealTimePointFeature(JSON
                    .parse(message.data));
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

                    if (!angular.isDefined(stop))
                        stop = $interval(function () {
                            removeOldFeatures();
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }, 15000);

                    $scope.connectCommandLabel = "Disconnect";
                } else {
                    WebsocketGeoJSONService.disconnect();

                    if (angular.isDefined(stop)) {
                        $interval.cancel(stop);
                        stop = undefined;
                    }

                    $scope.showCount = false;
                    $scope.connectCommandLabel = "Connect";
                }
                $scope.messageCount = WebsocketGeoJSONService
                    .getMessageCount();
            };

            /**
             * Removes all features which are older than a given
             */
            function removeOldFeatures() {
                var currentmillis = $scope.currentUTCDate();
                var currentseconds = (currentmillis / 1000) - $scope.maxLastSeen;
                for (var id in $scope.features) {
                    var feature = $scope.features[id];
                    var featureSeenDate = feature.properties.messageGenerated;
                    if (currentseconds > featureSeenDate) {
                        delete $scope.features[id];
                    }
                }
            }

            $scope.currentUTCDate = function () {
                var now = new Date();
                var utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
                return utc;
                //return Date.now();
            }

            /**
             *
             * @param {Array}
             * @returns OpenLayers.Feature.Vector
             */
            function updateRealTimePointFeature(data) {
                if (data.geometry != null) {
                    var id = data.properties.hexIdent;

                    if (id != null) {
                        $scope.features[id] = data;
                    }
                }
            }

            $scope.$on('$destroy', function () {
                if (angular.isDefined(stop)) {
                    $interval.cancel(stop);
                    stop = undefined;
                }
            });
        } ]);