'use strict';

/**
 * @ngdoc factory
 * @name SOSJSONService
 * @description
 * # SOSJSONService
 * This factory extends the BaseService, it can be used to load Observations from a SOS Server
 * The sosConfig must contain the name and the types of the expected Observations
 * and the procedure, offering and the Url to the SOS Server if can either be a Pox or a Json URL
 *
 * Once this service is connected it polls for new data from the SOS-Server
 */
angular.module('angularol3jsuiApp')
  .factory('SOSJSONService',
  function ($http, $q, $timeout, sosConfig, BaseService) {
    var service = new BaseService();

    var timeout = null;

    var latestToDate = null;

    /**
     * Starts the timeout to poll the data from the sos server
     */
    service.connect = function () {
      if (service.isConnected()) {
        return;
      }

      // Kick off the timeout
      if (sosConfig.updateInterval > 0) {
        timeoutFunction();
      }
      else {
        timeout = true;
        loadRemoteData();
      }

      service.setEnableState(true);

      service.setStatus('Polling for Data');
    };

    /**
     * Stops the update timeout
     * then informs the subscribers
     */
    service.disconnect = function (message) {

      if (service.isConnected()) {
        if(sosConfig.updateInterval > 0){
          $timeout.cancel(timeout);
        }
        service.resetMessageCount();
        timeout = null;
      }

      service.setEnableState(false);

      var connectionStatusMessage = message;
      if (!connectionStatusMessage) {
        connectionStatusMessage = 'Disconnected';
      }

      service.setStatus(connectionStatusMessage);
    };

    /**
     * Returns whether the timeout for polling is currently active or not
     * @returns {boolean} true if active
     */
    service.isConnected = function () {
      return (timeout != null);
    };

    /**
     * Sets the given Area as Filter Area
     * @param filterArea the filterArea
     */
    service.setFilterArea = function (filterArea) {
      //To be implemented
      console.log('Do set filter area: ' + filterArea);
    };

    /**
     * calls the configured http service to load all observation from the given date range
     * @param dateFrom the start date
     * @param dateTo the end date
     * @returns {*} a promise to the results
     */
    function loadNewEntries(dateFrom, dateTo) {
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
          (sosConfig.procedure ? '	<sos:procedure>' + sosConfig.procedure + '</sos:procedure>' : '') +
          (sosConfig.offering ? '	<sos:offering>' + sosConfig.offering + '</sos:offering>' : '') +
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
      request.then(handleSuccess, handleError);
    }

    /**
     * Performs the loading of new data
     */
    function loadRemoteData() {
      var fromDate;
      if (angular.isObject(latestToDate)) {
        fromDate = latestToDate;
      }
      else {
        if (sosConfig.updateInterval > 0) {
          fromDate = new Date(new Date() - sosConfig.updateInterval);
        }
        else {
          fromDate = new Date(new Date() - 1);
        }
        latestToDate = fromDate;
      }
      var toDate = new Date();

      loadNewEntries(fromDate, toDate);
    }

    /**
     * Callback if exception occurs
     * @param response the response from the service
     * @returns {Promise}
     */
    function handleError(response) {
      var message;
      if (!angular.isObject(response.data) || !response.data.message) {
        message = 'An unknown error occurred.';
      }
      else {
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
      var geoFeatures = convertToFeatures(response);
      service.fireMessages(geoFeatures);

      if (service.isConnected()) {
        if (sosConfig.updateInterval > 0) {
          timeoutFunction();
        }
        else {
          loadRemoteData();
        }
      }
    }

    /**
     * Converts the given response to a collection of features
     * @param response the reponse from a successfull server call
     * @returns * {{}} or an [] depends on the used algorithm which contains the converted values
     */
    function convertToFeatures(response) {
      var observations = response.data.observations;
      if (sosConfig.skipOldObjects) {
        return convertNewestFeaturesOnly(observations);
      }
      else {
        return convertFeatures(observations);
      }
    }

    /**
     * Converts the given observations into features,
     * only the newest (by messageGenerated) features of a featureOfInterest will be returned
     * @param observations a array of observations
     * @returns {{}} a "map" object with feature id to feature
     */
    function convertNewestFeaturesOnly(observations) {
      var observationsLength = observations.length;
      var features = {};
      for (var i = 0; i < observationsLength; i++) {
        var observation = observations[i];
        if (observation.observableProperty in sosConfig.properties) {

          var currentFeature;
          if (!angular.isObject(features[observation.featureOfInterest])) {
            currentFeature = getFeatureObject(observation.featureOfInterest);
            features[observation.featureOfInterest] = currentFeature;
          }
          else {
            currentFeature = features[observation.featureOfInterest];
          }

          var resultTime = new Date(observation.resultTime);
          if (resultTime.getTime() > latestToDate.getTime()) {
            latestToDate = resultTime;
          }

          if (!currentFeature.properties.messageGenerated || currentFeature.properties.messageGenerated <= resultTime) {
            currentFeature.properties.messageGenerated = resultTime;
            updateFeature(currentFeature, observation);
          }
        }
      }
      return features;
    }

    /**
     * Returns the feature for the given observation
     * @param features the features map
     * @param observation the observation
     * @returns {*} the feature for the observation
     */
    function getFeatureForObservation(features, observation) {
      var currentFeature;
      var resultTime = observation.resultTime;
      if (!angular.isObject(features[observation.featureOfInterest])) {
        currentFeature = getFeatureObject(observation.featureOfInterest);
        currentFeature.properties.messageGenerated = new Date(resultTime);

        var featuresOfFot = {};
        featuresOfFot[resultTime] = currentFeature;
        features[observation.featureOfInterest] = featuresOfFot;
      }
      else {
        var featuresOfFot = features[observation.featureOfInterest];
        if (!angular.isObject(featuresOfFot[resultTime])) {
          currentFeature = getFeatureObject(observation.featureOfInterest);
          currentFeature.properties.messageGenerated = new Date(resultTime);

          featuresOfFot[observation.resultTime] = currentFeature;
        }
        else {
          currentFeature = featuresOfFot[resultTime];
        }
      }
      return currentFeature;
    }

    /**
     * Converts the given observations into features,
     * all features are created for the given observation. The resultTime property and the featureOfInterest
     * is used to identify values for the same feature instance
     * @param observations a array of observations
     * @returns [] a array with the generated features sorted by messageGenerated
     */
    function convertFeatures(observations) {
      var observationsLength = observations.length;
      var features = {};
      for (var i = 0; i < observationsLength; i++) {
        var observation = observations[i];
        if (observation.observableProperty in sosConfig.properties) {
          var currentFeature = getFeatureForObservation(features, observation);
          updateFeature(currentFeature, observation);
        }
      }

      var featuresArray = [];
      for (var key in features) {
        if (features.hasOwnProperty(key)) {
          var featuresOfFot = features[key];
          for (var featuresOfFotKeys in featuresOfFot) {
            if (featuresOfFot.hasOwnProperty(featuresOfFotKeys)) {
              featuresArray.push(featuresOfFot[featuresOfFotKeys]);
            }
          }
        }
      }

      featuresArray.sort(function (feature1, feature2) {
        return feature1.properties.messageGenerated > feature2.properties.messageGenerated;
      });

      if (featuresArray.length > 0) {
        var latestFeature = featuresArray[featuresArray.length - 1];
        latestToDate = latestFeature.properties.messageGenerated;
      }

      return featuresArray;
    }

    /**
     * Does update the property value or geometry of the given feature according the observation
     * @param feature the feature to update
     * @param observation the observation
     */
    function updateFeature(feature, observation) {
      var result = observation.result;
      var propertyType = sosConfig.properties[observation.observableProperty].type;
      var propertyName = sosConfig.properties[observation.observableProperty].name;

      if (propertyType === 'number') {
        feature.properties[propertyName] = result.value;
      }
      else if (propertyType === 'string') {
        feature.properties[propertyName] = result;
      }
      else if (propertyType === 'geojson') {
        feature[propertyName] = result;
      }
    }

    /**
     * Returns a bare feature object for the given identifier
     * it contains the id of the object and the messageReceived date as current date
     * @param identifier identifier the id of the feature
     * @returns {{type: string, properties: {messageReceived: Date}}} a bare feature object
     */
    function getFeatureObject(identifier) {
      return {
        type: "Feature",
        properties: {
          messageReceived: new Date()
        },
        id: identifier
      }
    }

    /**
     * The function to trigger the remote data loading
     * is delayed by {@link sosConfig.updateInterval}
     */
    function timeoutFunction() {
      timeout = $timeout(function () {
        loadRemoteData();
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
  }
)
;
