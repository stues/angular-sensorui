'use strict';

angular.module('angularol3jsuiApp')
    .factory('WebsocketGeoJSONService',
    function (websocketConfig) {
        var service = {};

        service.msgs = 0;

        service.connectionStatus = '';

        service.status = false;

        service.connect = function () {
            if (service.ws) {
                return;
            }

            var ws = new WebSocket(websocketConfig.url);

            ws.onopen = function () {
                service.connectionStatus = 'Connected';
                if(service.callbackStatus){
                    service.callbackStatus(service.connectionStatus);
                }
                service.status = true;
                if(service.callbackWebsocketEnablement){
                    service.callbackWebsocketEnablement(service.status);
                }
            };

            ws.onerror = function () {
                service.connectionStatus = 'Unable to open Connection';
                if(service.callbackStatus) {
                    service.callbackStatus(service.connectionStatus);
                }
                service.status = false;
                if(service.callbackWebsocketEnablement) {
                    service.callbackWebsocketEnablement(service.status);
                }
                service.closeConnection();
            };

            ws.onmessage = function (message) {
                service.msgs++;
                if(service.callbackMessageReceived) {
                    service.callbackMessageReceived(message);
                }

                if(service.callbackMessageAmount) {
                    service.callbackMessageAmount(service.msgs);
                }
            };

            service.ws = ws;
        };

        service.closeConnection = function () {
            if (service.ws) {
                service.ws.close();
                service.msgs = 0;
                delete service.ws;
            }
        };

        service.disconnect = function () {
            service.closeConnection();
            service.status = false;
            if(service.callbackWebsocketEnablement) {
                service.callbackWebsocketEnablement(service.status);
            }
            service.connectionStatus = 'Disconnected';
            if(service.callbackStatus){
                service.callbackStatus(service.connectionStatus);
            }
        };

        service.subscribeStatus = function (callbackStatus) {
            service.callbackStatus = callbackStatus;
        };

        service.subscribeMessages = function (callbackMessageReceived) {
            service.callbackMessageReceived = callbackMessageReceived;
        };

        service.subscribeMessageAmount = function (callbackMessageAmount) {
            service.callbackMessageAmount = callbackMessageAmount;
            if(service.callbackMessageAmount) {
                service.callbackMessageAmount(service.msgs);
            }
        };

        service.subscribeWebsocketEnablement = function (callbackWebsocketEnablement) {
            service.callbackWebsocketEnablement = callbackWebsocketEnablement;
            if(service.callbackWebsocketEnablement) {
                service.callbackWebsocketEnablement(service.status);
            }
        };

        service.sendMessage = function(message) {
            if(service.ws
                && service.ws.readyState === service.ws.OPEN){
                service.ws.send(message);
            }
        }

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