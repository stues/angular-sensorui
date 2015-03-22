'use strict';

angular.module('angularol3jsuiApp')
  .factory('WebsocketGeoJSONService',
  function (websocketConfig) {
    var service = {};
    BaseService.call(this, service);

    service.connect = function () {
      if (service.ws) {
        return;
      }

      var ws = new WebSocket(websocketConfig.url);

      ws.onopen = function () {
        service.connectionStatus = 'Connected';
        if (service.callbackStatus) {
          service.callbackStatus(service.connectionStatus);
        }
        service.status = true;
        if (service.callbackEnablement) {
          service.callbackEnablement(service.status);
        }
      };

      ws.onerror = function () {
        service.connectionStatus = 'Unable to open Connection';
        service.disconnect('Unable to open Connection');
      };

      ws.onmessage = function (message) {
        service.msgs++;
        if (service.callbackMessageReceived) {
          service.callbackMessageReceived(message.data);
        }

        if (service.callbackMessageAmount) {
          service.callbackMessageAmount(service.msgs);
        }
      };

      service.ws = ws;
    };

    function closeConnection() {
      if (service.isConnected()) {
        service.ws.close();
        service.msgs = 0;
        delete service.ws;
      }
    };

    service.disconnect = function (message) {
      closeConnection();
      service.status = false;
      if (service.callbackEnablement) {
        service.callbackEnablement(service.status);
      }

      if (message) {
        service.connectionStatus = message;
      }
      else {
        service.connectionStatus = 'Disconnected';
      }

      if (service.callbackStatus) {
        service.callbackStatus(service.connectionStatus);
      }
    };

    service.setFilterArea = function (area) {
      var message;
      if (area) {
        message = area;
      }
      else {
        message = websocketConfig.clearFilter;
      }
      service.sendMessage(JSON.stringify(message));
  }

    service.sendMessage = function (message) {
      if (service.isConnected()
        && service.ws.readyState === service.ws.OPEN) {
        service.ws.send(message);
      }
    }

    service.isConnected = function () {
      if (service.ws) {
        return true;
      }
      return false;
    };

    return service;
  });
