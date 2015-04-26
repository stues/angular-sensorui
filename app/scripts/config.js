'use strict';

angular.module('config', [])

.constant('ENV', 'production')

.constant('sosConfig', {requestType:'application/xml',jsonURL:'http://127.0.0.1:8080/52n-sos-webapp/sos/json',poxURL:'http://127.0.0.1:8080/52n-sos-webapp/sos/pox',updateInterval:2000,procedure:'http://stue.ch/sensorobservation/procedure/flighttracking',offering:'http://stue.ch/sensorobservation/offering/ads-b',properties:{'http://stue.ch/sensorobservation/observableProperty/callsign':{type:'string',name:'callsign'},'http://stue.ch/sensorobservation/observableProperty/position':{type:'geojson',name:'geometry'},'http://stue.ch/sensorobservation/observableProperty/heading':{type:'number',name:'heading'},'http://stue.ch/sensorobservation/observableProperty/altitude':{type:'number',name:'altitude'},'http://stue.ch/sensorobservation/observableProperty/speed':{type:'number',name:'groundSpeed'}},cleanupInterval:15000,featureLayerName:'SOS Tracks',featureProjection:'EPSG:4326',areaFilter:{type:'Polygon',coordinates:[[[7.315876,47.667385],[7.829487,47.642409],[7.848713,47.383623],[6.630604,47.265401],[7.315876,47.667385]]]},timeDeltaName:'sosDeltas'})

.constant('websocketConfig', {idProperty:'hexIdent',messageGeneratedProperty:'messageGenerated',url:'ws://127.0.0.1:8443/clientTrackData',featureLayerName:'Websocket Tracks',cleanupInterval:15000,featureProjection:'EPSG:4326',areaFilter:{type:'Feature',geometry:{type:'Polygon',coordinates:[[[7.315876,47.667385],[7.829487,47.642409],[7.848713,47.383623],[6.630604,47.265401],[7.315876,47.667385]]]},properties:{action:'setAreaFilter'}},clearFilter:{type:'Feature',properties:{action:'clearFilter'}},timeDeltaName:'websocketDeltas'})

.constant('mapConfig', {olCenter:{lat:46.801111,lon:8.226667,zoom:7},olBackgroundLayer:{source:{type:'OSM'}},olDefaults:{interactions:{mouseWheelZoom:true},controls:{zoom:false,rotate:false,attribution:false}}})

.constant('deltaConfig', {persistInterval:60000})

;