'use strict';

angular.module('angularol3jsuiApp')
    .service('SOSJSONService',
    function ($http, $q) {


        // Return public API.
        return({
            getNewEntries: getNewEntries
        });

        // I add a friend with the given name to the remote collection.
        function getNewEntries(name) {

            var request = $http({
                method: "post",
                url: "http://localhost:8080/52n-sos-webapp/sos/json",
                data: {
                    "request": "GetObservation",
                    "service": "SOS",
                    "version": "2.0.0",
                    "procedure": ["http://stue.ch/sensorobservation/procedure/flighttracking"],
                    "offering": ["http://stue.ch/sensorobservation/offering/ads-b"],
                    "temporalFilter": [
                        {
                            "during": {
                                "ref": "om:phenomenonTime",
                                "value": [
                                    "2014-10-21T20:27:15+01:00",
                                    "2014-10-21T20:27:30+01:00"
                                ]
                            }
                        }
                    ]
                }
            });

            return(request.then(handleSuccess, handleError));
        }

        function handleError(response) {
            if (
                !angular.isObject(response.data) || !response.data.message
                ) {

                return( $q.reject("An unknown error occurred.") );

            }
            return( $q.reject(response.data.message) );
        }

        function handleSuccess(response) {

            return( response.data );

        }
    });