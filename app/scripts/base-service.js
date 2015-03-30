'use strict';

angular.module('angularol3jsuiApp').factory('BaseService', function () {
  return function () {
    var service = {};

    service.enabled = false;

    service.connectionStatus = '';

    service.messageCount = 0;

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
      service.incrementMessageCount();
      service.fire('messages', messages);
    };

    /**
     * Subscribe a message count callback
     * @param callbackMessageCount a callback function
     */
    service.subscribeMessageCount = function (callbackMessageCount) {
      service.subscribe('messageCount', callbackMessageCount);
    };

    /**
     * Unsubscribe the given message count callback
     * @param callbackMessageCount the callback to unsubscribe
     */
    service.unsubscribeMessageCount = function (callbackMessageCount) {
      service.unsubscribe('messageCount', callbackMessageCount);
    };

    /**
     * Fires the new messages count to the handlers
     * @param messageCount the new message amount
     */
    service.fireMessageCount = function (messageCount) {
      service.fire('messageCount', messageCount);
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
     * @param callbackEnableState the callback to unsubscribe
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
     * Sets the messageCount to 0 and informs all the registered callbacks
     */
    service.resetMessageCount = function(){
      service.messageCount = 0;
      service.fireMessageCount(service.messageCount);
    };

    /**
     * Increments the message count and informs all the registered callbacks
     */
    service.incrementMessageCount = function(){
      service.messageCount++;
      service.fireMessageCount(service.messageCount);
    };

    /**
     * Returns the send message count
     * @returns {number} the send message count
     */
    service.getMessageCount = function () {
      if (service.isConnected()) {
        return service.messageCount;
      }
    };

    /**
     * Set a new connection status and inform all the registered callbacks
     * @param enabled the new connection status
     */
    service.setStatus = function(connectionStatus){
      service.connectionStatus = connectionStatus;
      service.fireStatus(service.connectionStatus);
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
     * Set the current enable state and inform all the registrered callbacks
     * @param enabled the new enable state
     */
    service.setEnableState = function(enabled){
      service.enabled = enabled;
      service.fireEnableState(service.enabled);
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
