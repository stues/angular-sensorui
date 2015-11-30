# angular-sensorui
An AngularJS project to display Sensor data provided by a Sensor Observeration Service (SOS) or received through a Websocket on a Openlayers3 Map

## Build process
This project can be build with node, bower and grunt

### Node
The following command can be run to download the required build libraries (requires node and npm https://nodejs.org/): npm install

### Bower
To download the webclient libraries, bower can be used, just run the following command: bower update

### Grunt
To be able to run the local grunt webserver the following dependencies must be installed:
npm install -g imagemin-gifsicle imagemin-jpegtran imagemin-optipng imagemin-pngquant grunt-ng-constant

## Run
### Run development version
To run a local webclient simply run: grunt serve
this will use the config/development.json config

### Run production version
To build and run a obfuscated/minimized version: grunt serve:dist
will use the config/development.json config

## Server
## ADS-B Data Provider
An example project for transmitting ADS-B/SBS1-Messages: https://github.com/stues/camel-sbs1route
