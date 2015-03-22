'use strict';

angular.module('angularol3jsuiApp')
  .service('SOSJSONService',
  function ($http, $q, $timeout, sosConfig) {

    var service = {};

    service.latestToDate;

    service.msgs = 0;

    service.connectionStatus = '';

    service.status = false;

    service.interval;

    /**
     * calls the configured http service to load all observation from the given date range
     * @param dateFrom the start date
     * @param dateTo the end date
     * @returns {*}
     */
    service.getNewEntries = function(dateFrom, dateTo) {
      var request;
      if (sosConfig.requestType == "application/xml") {
        request = $http({
          method: "post",
          url: sosConfig.poxURL,
          data: '<?xml version="1.0" encoding="UTF-8"?>'
          + '<sos:GetObservation service="SOS" version="2.0.0"'
          + '  xmlns:sos="http://www.opengis.net/sos/2.0"'
          + '  xmlns:fes="http://www.opengis.net/fes/2.0"'
          + '  xmlns:gml="http://www.opengis.net/gml/3.2"'
          + '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sos/2.0 http://schemas.opengis.net/sos/2.0/sos.xsd">'
          + '	<sos:procedure>' + sosConfig.procedure + '</sos:procedure>'
          + '	<sos:offering>' + sosConfig.offering + '</sos:offering>'
          + '	<sos:temporalFilter>'
          + '		<fes:During>'
          + '		<fes:ValueReference>phenomenonTime</fes:ValueReference>'
          + '			<gml:TimePeriod gml:id="t1">'
          + '				<gml:beginPosition>' + dateFrom.toISOString() + '</gml:beginPosition>'
          + '				<gml:endPosition>' + dateTo.toISOString() + '</gml:endPosition>'
          + '			</gml:TimePeriod>'
          + '		</fes:During>'
          + '	</sos:temporalFilter>'
          + '  <sos:responseFormat>application/json</sos:responseFormat>'
          + '</sos:GetObservation>'
        });
      }
      else if (sosConfig.requestType == "application/json") {
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

      var message;
      if (!angular.isObject(response.data) || !response.data.message) {
        message = "An unknown error occurred.";
      }
      else{
        message = response.data.message;
      }

      service.disconnect(message);


    }

    /**
     * Callback on a successful request
     * @param response the response from the service
     * @returns {*}
     */
    function handleSuccess(response) {
      service.msgs += response.data.observations.length;
      if (service.callbackMessageReceived) {
        service.callbackMessageReceived(response.data);
      }

      if (service.callbackMessageAmount) {
        service.callbackMessageAmount(service.msgs);
      }
    }

    /**
     * The function to trigger the remote data loading
     * is delayed by {@link sosConfig.updateInterval}
     */
    service.intervalFunction = function () {
      service.interval = $timeout(function () {
        service.loadRemoteData();
      }, sosConfig.updateInterval)
    };


    service.subscribeStatus = function (callbackStatus) {
      service.callbackStatus = callbackStatus;
    };

    service.subscribeMessages = function (callbackMessageReceived) {
      service.callbackMessageReceived = callbackMessageReceived;
    };

    service.subscribeMessageAmount = function (callbackMessageAmount) {
      service.callbackMessageAmount = callbackMessageAmount;
      if (service.callbackMessageAmount) {
        service.callbackMessageAmount(service.msgs);
      }
    };

    service.subscribeEnablement = function (callbackEnablement) {
      service.callbackEnablement = callbackEnablement;
      if (service.callbackEnablement) {
        service.callbackEnablement(service.status);
      }
    };

    // Function to replicate setInterval using $timeout service.
    service.intervalFunction = function () {
      service.interval = $timeout(function () {
        service.loadRemoteData();
      }, sosConfig.updateInterval)
    };

    service.connect = function () {
      if (service.interval) {
        return;
      }

      // Kick off the interval
      service.intervalFunction();

      service.connectionStatus = 'Polling for Data';
      if (service.callbackStatus) {
        service.callbackStatus(service.connectionStatus);
      }
      service.status = true;
      if (service.callbackEnablement) {
        service.callbackEnablement(service.status);
      }
    };

    /**
     * Stops the update interval
     * then informs the subscribers
     */
    service.disconnect = function (message) {

      if (angular.isDefined(service.interval)) {
        $timeout.cancel(service.interval);
        service.msgs = 0;
        service.interval = undefined;
      }

      service.status = false;
      if (service.callbackEnablement) {
        service.callbackEnablement(service.status);
      }

      if(message){
        service.connectionStatus = message;
      }
      else{
        service.connectionStatus = 'Disconnected';
      }

      if (service.callbackStatus) {
        service.callbackStatus(service.connectionStatus);
      }
    };

    /**
     * Performs the loading of new data
     */
    service.loadRemoteData = function () {
      var fromDate;
      if (angular.isObject(service.latestToDate)) {
        fromDate = service.latestToDate;
      }
      else {
        fromDate = new Date(new Date() - sosConfig.updateInterval);
      }
      var toDate = new Date();
      service.latestToDate = toDate;
      service.getNewEntries(fromDate, toDate);

      if(angular.isDefined(service.interval)){
        service.intervalFunction();
      }
    };

    service.getNextOperationLabel = function () {
      if (service.isConnected()) {
        return 'Disconnect';
      } else {
        return 'Connect';
      }
    };

    service.isConnected = function () {
      if (service.interval) {
        return true;
      }
      return false;
    };

    service.getMessageCount = function () {
      if (service.isConnected()) {
        return service.msgs;
      }
      return;
    };

    service.getStatus = function () {
      if (service.isConnected()) {
        return service.connectionStatus;
      }
      return;
    };

    return service;
  });
