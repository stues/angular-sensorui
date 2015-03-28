'use strict';

angular.module('angularol3jsuiApp').factory('BaseService', function () {
  return function () {
    var service = {};

    service.msgs = 0;

    service.connectionStatus = '';

    service.enabled = false;

    service.callbackHandlers = {};

    /**
     * Subscribe a status callback
     * @param callbackStatus a callback function
     */
    service.subscribeStatus = function (callbackStatus) {
      service.subscribe('status', callbackStatus);
    };

    /**
     * Unsubscribe the given status callback
     * @param callbackStatus the callback to unsubscribe
     */
    service.unsubscribeStatus = function (callbackStatus) {
      service.unsubscribe('status', callbackStatus);
    };

    /**
     * Fires the new status to the handlers
     * @param status the new status
     */
    service.fireStatus = function (status) {
      service.fire('status', status);
    };

    /**
     * Subscribe a message callback
     * All the messages which were received from the service are send to this callback
     * @param callbackMessages a callback function
     */
    service.subscribeMessages = function (callbackMessages) {
      service.subscribe('messages', callbackMessages);
    };

    /**
     * Unsubscribe the given message callback
     * @param callbackMessages the callback to unsubscribe
     */
    service.unsubscribeMessages = function (callbackMessages) {
      service.unsubscribe('messages', callbackMessages);
    };

    /**
     * Fires the new messages to the handlers
     * @param messages the new messages
     */
    service.fireMessages = function (messages) {
      service.fire('messages', messages);
    };

    /**
     * Subscribe a message amount callback
     * @param callbackMessageAmount a callback function
     */
    service.subscribeMessageAmount = function (callbackMessageAmount) {
      service.subscribe('messageAmount', callbackMessageAmount);
    };

    /**
     * Unsubscribe the given message amount callback
     * @param callbackMessageAmount the callback to unsubscribe
     */
    service.unsubscribeMessageAmount = function (callbackMessageAmount) {
      service.unsubscribe('messageAmount', callbackMessageAmount);
    };

    /**
     * Fires the new messages to the handlers
     * @param messageAmount the new message amount
     */
    service.fireMessageAmount = function (messageAmount) {
      service.fire('messageAmount', messageAmount);
    };

    /**
     * Subscribe a enableState callback
     * @param callbackEnableState a callback function
     */
    service.subscribeEnableState = function (callbackEnableState) {
      service.subscribe('enableState', callbackEnableState);

    };

    /**
     * Unsubscribe the given message enableState callback
     * @param callbackMessageAmount the callback to unsubscribe
     */
    service.unsubscribeEnableState = function (callbackEnableState) {
      service.unsubscribe('enableState', callbackEnableState);
    };

    /**
     * Fires the new messages to the handlers
     * @param enableState the new service enableState
     */
    service.fireEnableState = function (enableState) {
      service.fire('enableState', enableState);
    };

    /**
     * Subscribes the callback to the given callback handler name
     * @param callbackHandlerName the name of the callback
     * @param callback the callback to subscribe
     */
    service.subscribe = function (callbackHandlerName, callback) {
      if (callback) {
        if (!this.callbackHandlers[callbackHandlerName]) {
          this.callbackHandlers[callbackHandlerName] = [];
        }
        this.callbackHandlers[callbackHandlerName].push(callback);
      }
    };

    /**
     * Unsubscribes the callback from the handlers list
     * @param handlers the handlers list
     * @param callback the callback to unsubscribe
     */
    service.unsubscribe = function (callbackHandlerName, callback) {
      if (callback) {
        if (this.callbackHandlers[callbackHandlerName]) {
          this.callbackHandlers[callbackHandlerName] = this.callbackHandlers[callbackHandlerName].filter(
            function (item) {
              if (item !== callback) {
                return item;
              }
            });
          if (this.callbackHandlers[callbackHandlerName].length === 0) {
            delete this.callbackHandlers[callbackHandlerName];
          }
        }
      }
    };

    /**
     * Fires the valueToFire to the handlers
     * @param callbackHandlerName the name of the callbackHandlers
     * @param valueToFire the value to fire
     */
    service.fire = function (callbackHandlerName, valueToFire) {
      if (this.callbackHandlers[callbackHandlerName]) {
        this.callbackHandlers[callbackHandlerName].forEach(function (item) {
          item(valueToFire);
        });
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

    /**
     * Whether the service is currently connected or not
     * @returns {*} true if enabled otherwise false
     */
    service.getEnableState = function () {
      return service.enabled;
    };

    return service;
  };
});
