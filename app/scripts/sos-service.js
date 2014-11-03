'use strict';

angular.module('angularol3jsuiApp')
    .service('SOSJSONService',
    function ($http, $q, sosConfig) {


        // Return public API.
        return({
            getNewEntries: getNewEntries
        });

        // I add a friend with the given name to the remote collection.
        function getNewEntries(dateFrom, dateTo) {
            var request = $http({
                method: "post",
                url: sosConfig.url,
                data: {
                    "request": "GetObservation",
                    "service": "SOS",
                    "version": "2.0.0",
                    "procedure": sosConfig.procedure,
                    "offering": sosConfig.offering,
                    "temporalFilter": [
                        {
                            "during": {
                                "ref": "om:phenomenonTime",
                                "value": [
                                    getShortISOString(dateFrom),
                                    getShortISOString(dateTo)
                                ]
                            }
                        }
                    ]
                }
            });

            return(request.then(handleSuccess, handleError));
        }


        function getShortISOString(date) {
            return date.getUTCFullYear() +
                "-" + (date.getUTCMonth() + 1) +
                "-" + date.getUTCDate() +
                "T" + date.getUTCHours() +
                ":" + date.getUTCMinutes() +
                ":" + date.getUTCSeconds() +
                "Z";
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
    })
;