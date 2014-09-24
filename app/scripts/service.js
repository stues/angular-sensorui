'use strict';

angular.module('angularol3jsuiApp')
    .factory(
    'WebsocketGeoJSONService',
    function () {
        var service = {};

        service.msgs = 0;
        service.connectionStatus = '';

        service.connect = function () {
            if (service.ws) {
                return;
            }

            var ws = new WebSocket('ws://127.0.0.1:8443/traffic');

            ws.onopen = function () {
                service.connectionStatus = 'Connected';
                service.callbackStatus(service.connectionStatus);
                service.callbackWebsocketEnablement(true);
            };

            ws.onerror = function () {
                service.connectionStatus = 'Unable to open Connection';
                service.callbackStatus(service.connectionStatus);
                service.callbackWebsocketEnablement(false);
                service.closeConnection();
            };

            ws.onmessage = function (message) {
                service.msgs++;
                service.callbackMessageReceived(message);
            };

            service.ws = ws;
        };

        service.closeConnection = function () {
            if (service.ws) {
                service.ws.close();
                service.msgs = 0;
                delete service.ws;
            }
            service.callbackWebsocketEnablement(false);
        };

        service.disconnect = function () {
            service.closeConnection();
            service.connectionStatus = 'Disconnected';
            service.callbackStatus(service.connectionStatus);
        };

        service.subscribeStatus = function (callbackStatus) {
            service.callbackStatus = callbackStatus;
        };

        service.subscribeMessages = function (callbackMessageReceived) {
            service.callbackMessageReceived = callbackMessageReceived;
        };

        service.subscribeWebsocketEnablement = function (callbackWebsocketEnablement) {
            service.callbackWebsocketEnablement = callbackWebsocketEnablement;
        };

        service.getNextOperationLabel = function () {
            if (service.ws) {
                return 'Disconnect';
            } else {
                return 'Connect';
            }
        };

        service.getMessageCount = function () {
            if (service.ws) {
                return service.msgs;
            }
        };

        service.isConnected = function () {
            if (service.ws) {
                return true;
            }
            return false;
        };

        return service;
    });