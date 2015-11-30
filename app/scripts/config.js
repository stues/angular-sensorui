'use strict';

angular.module('config', [])

.constant('ENV', 'production')

.constant('appConfig', {mapPages:[{id:'websocketMap',displayName:'Websocket Map',url:'/websocket-map',config:'websocketConfig',dataService:'WebsocketGeoJSONService',styleService:'ShipStyleService'},{id:'sosMap',displayName:'SOS Map',url:'/sos-map',config:'sosConfig',dataService:'SOSJSONService',styleService:'AircraftStyleService'}]})

.constant('sosConfig', {requestType:'application/xml',jsonURL:'http://127.0.0.1:8080/52n-sos-webapp/sos/json',poxURL:'http://127.0.0.1:8080/52n-sos-webapp/sos/pox',updateInterval:1000,requestDelay:0,extendTimePeriod:true,procedure:null,offering:'http://stue.ch/sensorobservation/offering/flighttracking',properties:{'http://stue.ch/sensorobservation/observableProperty/callsign':{type:'string',name:'callsign'},'http://stue.ch/sensorobservation/observableProperty/position':{type:'geojson',name:'geometry'},'http://stue.ch/sensorobservation/observableProperty/heading':{type:'number',name:'heading'},'http://stue.ch/sensorobservation/observableProperty/altitude':{type:'number',name:'altitude'},'http://stue.ch/sensorobservation/observableProperty/speed':{type:'number',name:'groundSpeed'}},cleanupInterval:15000,featureLayerName:'SOS Tracks',dataProjection:'EPSG:4326',filterArea:{dataProjection:'EPSG:4326',areaFilter:{type:'Polygon',coordinates:[[[7.315876,47.667385],[7.829487,47.642409],[7.848713,47.383623],[6.630604,47.265401],[7.315876,47.667385]]]}},timeDeltaLoggerName:'sosDeltas',enableTimeDeltaLogger:true,receivedDataLoggerName:'sosData',enableReceivedDataLogger:true})

.constant('websocketConfig', {idProperty:'userId',messageGeneratedProperty:'timeStamp',url:'ws://127.0.0.1:8443/clientTrackData',featureLayerName:'Websocket Tracks',cleanupInterval:15000,dataProjection:'EPSG:4326',filterArea:{dataProjection:'EPSG:4326',areaFilter:{type:'Feature',geometry:{type:'Polygon',coordinates:[[[7.315876,47.667385],[7.829487,47.642409],[7.848713,47.383623],[6.630604,47.265401],[7.315876,47.667385]]]},properties:{action:'setAreaFilter'}},clearFilter:{type:'Feature',properties:{action:'clearFilter'}}},timeDeltaLoggerName:'websocketDeltas',enableTimeDeltaLogger:true,receivedDataLoggerName:'websocketData',enableReceivedDataLogger:true,skipOldObjects:false})

.constant('mapConfig', {mapProjection:'EPSG:3857',olCenter:{lat:46.801111,lon:8.226667,zoom:7},olBackgroundLayer:{source:{type:'OSM'}},olDefaults:{interactions:{mouseWheelZoom:true},controls:{zoom:false,rotate:false,attribution:false}},tableAttributesInterval:500,displayProperties:[{property:'id',label:'Ship ID'},{property:'speedOverGround',label:'Speed'},{property:'courseOverGround',label:'Heading'},{property:'trueHeading',label:'True Heading'},{property:'specialManoeuvre',label:'Special Manoeuvre'},{property:'spareProperty',label:'Spare Property'},{property:'raimFlag',label:'Raim Flag'},{property:'pointLat',label:'Position Latitude'},{property:'pointLon',label:'Position Longitude'},{property:'lastSeen',label:'Last Seen'}]})

.constant('deltaConfig', {persistInterval:60000})

.constant('receivedDataConfig', {persistInterval:1000})

;