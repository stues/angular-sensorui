"use strict";

angular.module('config', [])

    .constant('ENV', 'development')

    .constant('sosConfig', {url: 'http://localhost:8080/52n-sos-webapp/sos/json', procedure: ['http://stue.ch/sensorobservation/procedure/flighttracking'], offering: ['http://stue.ch/sensorobservation/offering/ads-b'], properties: {'http://stue.ch/sensorobservation/observableProperty/callsign': {type: 'string', name: 'callsign'}, 'http://stue.ch/sensorobservation/observableProperty/position': {type: 'geojson', name: 'geometry'}, 'http://stue.ch/sensorobservation/observableProperty/heading': {type: 'number', name: 'heading'}, 'http://stue.ch/sensorobservation/observableProperty/altitude': {type: 'number', name: 'altitude'}, 'http://stue.ch/sensorobservation/observableProperty/speed': {type: 'number', name: 'speed'}}})

    .constant('websocketConfig', {url: 'ws://127.0.0.1:8443/traffic'})

;