'use strict';

angular.module('angularol3jsuiApp')
  .factory('WebsocketGeoJSONService', function (websocketConfig, BaseService) {

    var service = new BaseService();

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
        service.setStatus('Connected');
        service.setEnableState(true);
      };

      ws.onerror = function () {
        service.disconnect('Unable to open Connection');
      };

      ws.onmessage = function (message) {
        service.fireMessages(message.data);
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
        service.resetMessageCount();
        delete service.ws;
      }
    }

    /**
     * Disconnect from the service inform all subscribers
     * @param message
     */
    service.disconnect = function (message) {
      closeConnection();
      service.setEnableState(false);

      var connectionStatusMessage = message;
      if (!connectionStatusMessage) {
        connectionStatusMessage = 'Disconnected';
      }
      service.setStatus(connectionStatusMessage);
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
    };

    /**
     * Sends the given message trough the websocket (if connected)
     * @param message the message to send
     */
    service.sendMessage = function (message) {
      if (service.isConnected() &&
        service.ws.readyState === service.ws.OPEN) {
        service.ws.send(message);
      }
    };

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
