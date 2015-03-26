'use strict';

angular.module('angularol3jsuiApp')
  .factory('WebsocketGeoJSONService',
  function (websocketConfig) {
    var service = {};
    BaseService.call(this, service);

    /**
     * Connect to the configured service and
     * informs all subscribes whether connected
     * or if an error occurred during connecting
     */
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

    /**
     * Closes the connection to the websocket
     * and deletes the service.ws instance
     */
    function closeConnection() {
      if (service.isConnected()) {
        service.ws.close();
        service.msgs = 0;
        delete service.ws;
      }
    };

    /**
     * Disconnect from the service inform all subscribers
     * @param message
     */
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

    /**
     * Set the given area as filter, if area is undefined, the clearFilter
     * from the websocketConfig will be sent
     * @param area
     */
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

    /**
     * Sends the given message trough the websocket (if connected)
     * @param message the message to send
     */
    service.sendMessage = function (message) {
      if (service.isConnected()
        && service.ws.readyState === service.ws.OPEN) {
        service.ws.send(message);
      }
    }

    /**
     * Whether the websocket is currently connected or not
     * @returns {boolean} true if connected otherwise false
     */
    service.isConnected = function () {
      if (service.ws) {
        return true;
      }
      return false;
    };

    return service;
  });
