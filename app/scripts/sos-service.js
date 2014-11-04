'use strict';

angular.module('angularol3jsuiApp')
    .service('SOSJSONService',
    function ($http, $q, sosConfig) {

        /**
         * The Public API
         */
        return({
            getNewEntries: getNewEntries
        });

        /**
         * calls the configured http service to load all observation from the given date range
         * @param dateFrom the start date
         * @param dateTo the end date
         * @returns {*}
         */
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

        /**
         * Returns the given date as short is string
         * @param date the date
         * @returns {string} the date string as short iso string
         */
        function getShortISOString(date) {
            return date.getUTCFullYear() +
                "-" + (date.getUTCMonth() + 1) +
                "-" + date.getUTCDate() +
                "T" + date.getUTCHours() +
                ":" + date.getUTCMinutes() +
                ":" + date.getUTCSeconds() +
                "Z";
        }

        /**
         * Callback if exception occurs
         * @param response the response from the service
         * @returns {Promise}
         */
        function handleError(response) {
            if (!angular.isObject(response.data) || !response.data.message) {

                return( $q.reject("An unknown error occurred.") );

            }
            return( $q.reject(response.data.message) );
        }

        /**
         * Callback on a successful request
         * @param response the response from the service
         * @returns {*}
         */
        function handleSuccess(response) {

            return( response.data );

        }
    })
;