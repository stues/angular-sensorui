'use strict';

function BaseService(service) {
  service.msgs = 0;

  service.connectionStatus = '';

  service.status = false;

  /**
   * Subscribe a status callback
   * @param callbackStatus a callback function
   */
  service.subscribeStatus = function (callbackStatus) {
    service.callbackStatus = callbackStatus;
  };

  /**
   * Subscribe a message callback
   * All the messages which were received from the service are send to this callback
   * @param callbackMessageReceived a callback function
   */
  service.subscribeMessages = function (callbackMessageReceived) {
    service.callbackMessageReceived = callbackMessageReceived;
  };

  /**
   * Subscribe a message amount callback
   * @param callbackMessageAmount a callback function
   */
  service.subscribeMessageAmount = function (callbackMessageAmount) {
    service.callbackMessageAmount = callbackMessageAmount;
    if (service.callbackMessageAmount) {
      service.callbackMessageAmount(service.msgs);
    }
  };

  /**
   * Subscribe a enablement callback
   * @param callbackEnablement a callback function
   */
  service.subscribeEnablement = function (callbackEnablement) {
    service.callbackEnablement = callbackEnablement;
    if (service.callbackEnablement) {
      service.callbackEnablement(service.status);
    }
  };

  /**
   * Returns the next operation label
   * @returns {string} the next operation label
   */
  service.getNextOperationLabel = function () {
    if (service.isConnected()) {
      return 'Disconnect';
    } else {
      return 'Connect';
    }
  };

  /**
   * Returns the send message count
   * @returns {number} the send message count
   */
  service.getMessageCount = function () {
    if (service.isConnected()) {
      return service.msgs;
    }
  };

  /**
   * The current service status
   * @returns {string} the current service status
   */
  service.getStatus = function () {
    if (service.isConnected()) {
      return service.connectionStatus;
    }
  };

  return this;
};
