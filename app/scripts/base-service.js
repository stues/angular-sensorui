'use strict';

function BaseService(service) {
    service.msgs = 0;

    service.connectionStatus = '';

    service.status = false;

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

    service.getNextOperationLabel = function () {
      if (service.isConnected()) {
        return 'Disconnect';
      } else {
        return 'Connect';
      }
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

    return this;
  };
