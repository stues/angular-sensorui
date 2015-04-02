'use strict';

angular.module('angularol3jsuiApp')
  .factory('SOSJSONService',
  function ($http, $q, $timeout, sosConfig, BaseService) {
    var service = new BaseService();

    service.interval = undefined;

    service.latestToDate = undefined;

    /**
     * calls the configured http service to load all observation from the given date range
     * @param dateFrom the start date
     * @param dateTo the end date
     * @returns {*} a promise to the results
     */
    service.getNewEntries = function (dateFrom, dateTo) {
      var request;
      if (sosConfig.requestType === 'application/xml') {
        request = $http({
          method: 'post',
          url: sosConfig.poxURL,
          data: '<?xml version="1.0" encoding="UTF-8"?>' +
          '<sos:GetObservation service="SOS" version="2.0.0"' +
          '  xmlns:sos="http://www.opengis.net/sos/2.0"' +
          '  xmlns:fes="http://www.opengis.net/fes/2.0"' +
          '  xmlns:gml="http://www.opengis.net/gml/3.2"' +
          '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sos/2.0 http://schemas.opengis.net/sos/2.0/sos.xsd">' +
          '	<sos:procedure>' + sosConfig.procedure + '</sos:procedure>' +
          '	<sos:offering>' + sosConfig.offering + '</sos:offering>' +
          '	<sos:temporalFilter>' +
          '		<fes:During>' +
          '		<fes:ValueReference>phenomenonTime</fes:ValueReference>' +
          '			<gml:TimePeriod gml:id="t1">' +
          '				<gml:beginPosition>' + dateFrom.toISOString() + '</gml:beginPosition>' +
          '				<gml:endPosition>' + dateTo.toISOString() + '</gml:endPosition>' +
          '			</gml:TimePeriod>' +
          '		</fes:During>' +
          '	</sos:temporalFilter>' +
          '  <sos:responseFormat>application/json</sos:responseFormat>' +
          '</sos:GetObservation>'
        });
      }
      else if (sosConfig.requestType === 'application/json') {
        request = $http({
          method: 'post',
          url: sosConfig.jsonURL,
          data: {
            request: 'GetObservation',
            service: 'SOS',
            version: '2.0.0',
            procedure: sosConfig.procedure,
            offering: sosConfig.offering,
            temporalFilter: [
              {
                during: {
                  ref: 'om:phenomenonTime',
                  value: [
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
        throw 'Unknown Request Type';
      }
      return (request.then(handleSuccess, handleError));
    };

    /**
     * Sets the given Area as Filter Area
     * @param filterArea the filterArea
     */
    service.setFilterArea = function (filterArea) {
      //To be implemented
      console.log('Do Filter Area' + filterArea);
    };

    /**
     * Starts the interval to poll the data from the sos server
     */
    service.connect = function () {
      if (service.interval) {
        return;
      }

      // Kick off the interval
      intervalFunction();

      service.setStatus('Polling for Data');

      service.setEnableState(true);
    };

    /**
     * Stops the update interval
     * then informs the subscribers
     */
    service.disconnect = function (message) {

      if (angular.isDefined(service.interval)) {
        $timeout.cancel(service.interval);
        service.resetMessageCount();
        service.interval = undefined;
      }

      service.setEnableState(false);

      var connectionStatusMessage = message;
      if (!connectionStatusMessage) {
        connectionStatusMessage = 'Disconnected';
      }

      service.setStatus(connectionStatusMessage);
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

      if (angular.isDefined(service.interval)) {
        intervalFunction();
      }
    };

    /**
     * Returns whether the interval for polling is currently active or not
     * @returns {boolean} true if active
     */
    service.isConnected = function () {
      if (service.interval) {
        return true;
      }
      return false;
    };

    /**
     * Callback if exception occurs
     * @param response the response from the service
     * @returns {Promise}
     */
    function handleError(response) {
      if (!angular.isObject(response.data) || !response.data.message) {
        return ( $q.reject('An unknown error occurred.') );
      }

      var message;
      if (!angular.isObject(response.data) || !response.data.message) {
        message = 'An unknown error occurred.';
      }
      else {
        message = response.data.message;
      }

      service.disconnect(message);
      return ( $q.reject(message) );
    }

    /**
     * Callback on a successful request
     * @param response the response from the service
     * @returns {*}
     */
    function handleSuccess(response) {
      var geoFeatures = convertToFeatures(response);
      service.fireMessages(geoFeatures);
    }

    /**
     * Converts the given response to a collection of features
     * @param response the reponse from a successfull server call
     * @returns {{}} a "map" object with feature id to feature
     */
    function convertToFeatures(response) {
      var observations = response.data.observations;
      var observationsLength = observations.length;
      var features = {};
      for (var i = 0; i < observationsLength; i++) {
        var observation = observations[i];
        if (observation.observableProperty in sosConfig.properties) {
          var result = observation.result;

          if (!angular.isObject(features[observation.featureOfInterest])) {
            features[observation.featureOfInterest] = {};
            features[observation.featureOfInterest].properties = {};
            features[observation.featureOfInterest].id = observation.featureOfInterest;
          }

          features[observation.featureOfInterest].properties.messageGenerated = new Date(observation.resultTime);
          features[observation.featureOfInterest].properties.messageReceived = new Date();

          var propertyType = sosConfig.properties[observation.observableProperty].type;
          var propertyName = sosConfig.properties[observation.observableProperty].name;

          if (propertyType === 'number') {
            features[observation.featureOfInterest].properties[propertyName] = result.value;
          }
          else if (propertyType === 'string') {
            features[observation.featureOfInterest].properties[propertyName] = result;
          }
          else if (propertyType === 'geojson') {
            features[observation.featureOfInterest][propertyName] = result;
          }
        }
      }
      return features;
    }

    /**
     * The function to trigger the remote data loading
     * is delayed by {@link sosConfig.updateInterval}
     */
    function intervalFunction() {
      service.interval = $timeout(function () {
        service.loadRemoteData();
      }, sosConfig.updateInterval);
    }

    /**
     * Returns the given date as short is string
     * @param date the date
     * @returns {string} the date string as short iso string
     */
    function getShortISOString(date) {
      return date.getUTCFullYear() +
        '-' + (date.getUTCMonth() + 1) +
        '-' + date.getUTCDate() +
        'T' + date.getUTCHours() +
        ':' + date.getUTCMinutes() +
        ':' + date.getUTCSeconds() +
        'Z';
    }

    return service;
  });
