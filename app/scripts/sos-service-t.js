'use strict';

angular.module('angularol3jsuiApp')
  .service('SOSJSONService',
  function ($http, $q, sosConfig) {

    /**
     * The Public API
     */
    return ({
      getNewEntries: getNewEntries
    });

    /**
     * calls the configured http service to load all observation from the given date range
     * @param dateFrom the start date
     * @param dateTo the end date
     * @returns {*}
     */
    function getNewEntries(dateFrom, dateTo) {
      var request;
      if(sosConfig.requestType == "application/xml"){
        request = $http({
          method: "post",
          url: sosConfig.poxURL,
          data: '<?xml version="1.0" encoding="UTF-8"?>'
          +'<sos:GetObservation service="SOS" version="2.0.0"'
          +'  xmlns:sos="http://www.opengis.net/sos/2.0"'
          +'  xmlns:fes="http://www.opengis.net/fes/2.0"'
          +'  xmlns:gml="http://www.opengis.net/gml/3.2"'
          +'  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sos/2.0 http://schemas.opengis.net/sos/2.0/sos.xsd">'
          +'	<sos:procedure>' + sosConfig.procedure + '</sos:procedure>'
          +'	<sos:offering>' + sosConfig.offering + '</sos:offering>'
          +'	<sos:temporalFilter>'
          +'		<fes:During>'
          +'		<fes:ValueReference>phenomenonTime</fes:ValueReference>'
          +'			<gml:TimePeriod gml:id="t1">'
          +'				<gml:beginPosition>' + dateFrom.toISOString() + '</gml:beginPosition>'
          +'				<gml:endPosition>' + dateTo.toISOString() + '</gml:endPosition>'
          +'			</gml:TimePeriod>'
          +'		</fes:During>'
          +'	</sos:temporalFilter>'
          +'  <sos:responseFormat>application/json</sos:responseFormat>'
          +'</sos:GetObservation>'
        });
      }
      else if(sosConfig.requestType == "application/json"){
         request = $http({
          method: "post",
          url: sosConfig.jsonURL,
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
      }
      else {
        throw "Unknown Request Type";
      }
      return (request.then(handleSuccess, handleError));
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

        return ( $q.reject("An unknown error occurred.") );

      }
      return ( $q.reject(response.data.message) );
    }

    /**
     * Callback on a successful request
     * @param response the response from the service
     * @returns {*}
     */
    function handleSuccess(response) {

      return ( response.data );

    }
  })
;
