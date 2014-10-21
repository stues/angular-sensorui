'use strict';

angular.module('angularol3jsuiApp')
    .controller(
    'SOSObjectTableCtrl',
    [
        '$scope',
        'SOSJSONService',
        function ($scope, SOSJSONService) {

            $scope.features = [];

            loadRemoteData();

            function applyRemoteData( entries ) {

                $scope.features = entries;

            }

            function loadRemoteData() {

                SOSJSONService.getNewEntries()
                    .then(
                    function (entries) {

                        applyRemoteData(entries);

                    }
                )
                ;

            }
        } ]);