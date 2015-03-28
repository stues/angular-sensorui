'use strict';

function BaseService(service) {
  service.msgs = 0;

  service.connectionStatus = '';

  service.enabled = false;

  service.callbackHandlers = {
    status: [],
    messages: [],
    messageAmount: [],
    enableState: []
  };

  /**
   * Subscribe a status callback
   * @param callbackStatus a callback function
   */
  service.subscribeStatus = function (callbackStatus) {
    service.callbackHandlers.status.push(callbackStatus);
  };

  /**
   * Unsubscribe the given status callback
   * @param callbackStatus the callback to unsubscribe
   */
  service.unsubscribeStatus = function (callbackStatus) {
    service.callbackHandlers.status = service.unsubscribe(service.callbackHandlers.status, callbackStatus);
  };

  /**
   * Fires the new status to the handlers
   * @param status the new status
   */
  service.fireStatus = function (status) {
    service.fire(service.callbackHandlers.status, status);
  };

  /**
   * Subscribe a message callback
   * All the messages which were received from the service are send to this callback
   * @param callbackMessageReceived a callback function
   */
  service.subscribeMessages = function (callbackMessageReceived) {
    if (callbackMessageReceived) {
      service.callbackHandlers.messages.push(callbackMessageReceived);
    }
  };

  /**
   * Unsubscribe the given message callback
   * @param callbackStatus the callback to unsubscribe
   */
  service.unsubscribeMessages = function (callbackMessageReceived) {
    service.callbackHandlers.messages = service.unsubscribe(service.callbackHandlers.messages, callbackMessageReceived);
  };

  /**
   * Fires the new messages to the handlers
   * @param messages the new messages
   */
  service.fireMessages = function (messages) {
    service.fire(service.callbackHandlers.messages, messages);
  };

  /**
   * Subscribe a message amount callback
   * @param callbackMessageAmount a callback function
   */
  service.subscribeMessageAmount = function (callbackMessageAmount) {
    if (callbackMessageAmount) {
      service.callbackHandlers.messageAmount.push(callbackMessageAmount);
    }
  };

  /**
   * Unsubscribe the given message amount callback
   * @param callbackMessageAmount the callback to unsubscribe
   */
  service.unsubscribeMessageAmount = function (callbackMessageAmount) {
    service.callbackHandlers.messageAmount = service.unsubscribe(service.callbackHandlers.messageAmount, callbackMessageAmount);
  };

  /**
   * Fires the new messages to the handlers
   * @param messageAmount the new message amount
   */
  service.fireMessageAmount = function (messageAmount) {
    service.fire(service.callbackHandlers.messageAmount, messageAmount);
  };

  /**
   * Subscribe a enableState callback
   * @param callbackEnableState a callback function
   */
  service.subscribeEnableState = function (callbackEnableState) {
    if (callbackEnableState) {
      service.callbackHandlers.enableState.push(callbackEnableState);
    }
  };

  /**
   * Unsubscribe the given message enableState callback
   * @param callbackMessageAmount the callback to unsubscribe
   */
  service.unsubscribeEnableState = function (callbackEnableState) {
    service.callbackHandlers.enableState = service.unsubscribe(service.callbackHandlers.enableState, callbackEnableState);
  };

  /**
   * Fires the new messages to the handlers
   * @param enableState the new service enableState
   */
  service.fireEnableState = function (enableState) {
    service.fire(service.callbackHandlers.enableState, enableState);
  };

  /**
   * Unsubscribes the callback from the handlers list
   * @param handlers the handlers list
   * @param callback the callback to unsubscribe
   * @returns {*} the new handlers list
   */
  service.unsubscribe = function (handlers, callback) {
    return handlers.filter(
      function (item) {
        if (item !== callback) {
          return item;
        }
      });
  };

  /**
   * Fires the valueToFire to the handlers
   * @param handlers the handlers
   * @param valueToFire the value to fire
   */
  service.fire = function(handlers, valueToFire) {
    handlers.forEach(function(item) {
      item(valueToFire);
    });
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

  /**
   * Whether the service is currently connected or not
   * @returns {*} true if enabled otherwise false
   */
  service.getEnableState = function () {
      return service.enableState;
  };

  return this;
};
