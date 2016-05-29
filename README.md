
![GPS.js](https://github.com/infusion/GPS.js/blob/master/res/logo.png?raw=true "Javascript GPS Parser")

[![NPM Package](https://img.shields.io/npm/v/gps.svg?style=flat)](https://npmjs.org/package/gps "View this project on npm")
[![Build Status](https://travis-ci.org/infusion/GPS.js.svg?branch=master)](https://travis-ci.org/infusion/GPS.js)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

GPS.js is an extensible parser for [NMEA](http://www.gpsinformation.org/dale/nmea.htm) sentences, given by any common GPS receiver. The output is tried to be as high-level as possible to make it more useful than simply splitting the information. The aim is, that you don't have to understand NMEA, just plug in your receiver and you're ready to go. 


Usage
===

The interface of GPS.js is as simple as the following few lines. You need to add an event-listener for the completion of the task and invoke the update method with a sentence you want to process. There are much more examples in the examples folder.

```javascript
var gps = new GPS;

// Add an event listener on all protocols
gps.on('data', function(parsed) {
    console.log(parsed);
});

// Call the update routine directly with a NMEA sentence, which would
// come from the serial port or stream-reader normally
gps.update("$GPGGA,224900.000,4832.3762,N,00903.5393,E,1,04,7.8,498.6,M,48.0,M,,0000*5E");
```

It's also possible to add event-listeners only on one of the following protocols, by stating `gps.on('GGA', ...)` for example.

State
===

The real advantage over other NMEA implementations is, that the GPS information is interpreted and normalized. The most high-level API is the state object, which changes with every new event. You can use this information with:

```javascript
gps.on('data', function() {
  console.log(gps.state);
});
```

Installation
===
Installing GPS.js is as easy as cloning this repo or use the following command:

```
npm install --save gps
```

Find the serial device
===

On Linux serial devices typically have names like `/dev/ttyS1`, on OSX `/dev/tty.usbmodem1411` after installing a USB to serial driver and on Windows, you're probably fine by using the highest COM device you can find in the device manager. Please note that if you have multople USB ports on your computer and use them randomly, you have to lookup the path/device again.

If you find yourself on a BeagleBone, the serial device must be registered manually. Luckily, this can be done within node quite easily using [octalbonescript](https://www.npmjs.com/package/octalbonescript):

```javascript
var obs = require('octalbonescript');
obs.serial.enable('/dev/ttyS1', function() {  
    console.log('serial device activated');
});
```

Examples
===

GPS.js comes with some examples, like drawing the current latutude and longitude to Google Maps, displaying a persistent state and displaying the parsed raw data. In some cases you have to adjust the serial path to your own GPS receiver to make it work.

Simple serial example
---

```javascript
var SerialPort = require('serialport');
var port = new SerialPort.SerialPort('/dev/tty.usbserial', { // change path
  baudrate: 4800,
  parser: SerialPort.parsers.readline('\r\n')
});

var GPS = require('gps');
var gps = new GPS;

gps.on('data', function(data) {
  console.log(data, gps.state);
});

port.on('data', function(data) {
  gps.update(data);
});
```

Dashboard
---
Go into the folder `examples/dashboard` and start the server with

```
node server
```

After that you can open the browser and go to http://localhost:3000 The result should look like, which in principle is just a visualiziation of the state object `gps.state`

![GPS TU Dresden](https://github.com/infusion/GPS.js/blob/master/res/dashboard.png?raw=true)

Google Maps
---
Go into the folder `examples/maps` and start the server with

```
node server
```

After that you can open the browser and go to http://localhost:3000 The result should look like

![GPS Google Maps Dresden](https://github.com/infusion/GPS.js/blob/master/res/maps.png?raw=true)

Confluence
---
[Confluence](http://www.confluence.org/) is a project, which tries to travel to and document all integer GPS coordinates. GPS.js can assist on that goal. Go into the examples folder and run:

```
node confluence
```

You should see something like the following, updating as you move around

```
You are at (48.53, 9.05951),
The closest confluence point (49, 9) is in 51.36 km.
You have to go 355.2° N
```

Set Time
---
On systems without a RTC - like Raspberry PI - you need to update the time yourself at runtime. If the device has an internet connection, it's quite easy to use an NTP server. An alternative for disconnected projects with access to a GPS receiver can be the high-precision time signal, sent by satellites. Go to the examples folder and run the following to update the time:

```
node set-time
```

Available Methods
===

update(line)
---
The update method is the most important function, it adds a new NMEA sentence and forces the callback to trigger

updatePartial(chunk)
---
Will call `update()` when a full NMEA sentence has been arrived

on(event, callback)
---
Adds an event listener for a protocol to occur (see implemented protocols, simply use the name - upper case) or for all sentences with `data`. Because GPS.js should be more general, it doesn't inherit `EventEmitter`, but simply invokes the callback.

off(event)
---
Removes an event listener

Implemented Protocols
===

GGA - Fix information
---
Gets the data, you're most probably looking for: *latitude and longitude*

The parsed object will have the following attributes:

- type: "GGA"
- time: The time given as a JavaScript Date object
- lat: The latitude
- lon: The longitude
- alt: The altitude
- quality: Fix quality (either invalid, fix or diff)
- satelites: Number of satellites being tracked
- hdop: Horizontal [dilution of precision](https://en.wikipedia.org/wiki/Dilution_of_precision_(GPS))
- geoidal: Height of geoid (mean sea level) 
- age: time in seconds since last DGPS update
- stationID: DGPS station ID number
- valid: Indicates if the checksum is okay

RMC - NMEAs own version of essential GPS data
---
Similar to GGA but gives also delivers the velocity

The parsed object will have the following attributes:

- type: "RMC"
- time: The time given as a JavaScript Date object
- status: Status active or void
- lat: The latitude
- lon: The longitude
- speed: Speed over the ground in km/h
- track: Track angle in degrees
- variation: Magnetic Variation
- faa: The FAA mode, introduced with NMEA 2.3
- valid: Indicates if the checksum is okay


GSA - Active satellites
---
The parsed object will have the following attributes:

- type: "GSA"
- mode: Auto selection of 2D or 3D fix (either auto or manual)
- fix: The selected fix mode (either 2D or 3D)
- satellites: Array of satellite IDs
- pdop: Position [dilution of precision](https://en.wikipedia.org/wiki/Dilution_of_precision_(GPS))
- vdop: Vertical [dilution of precision](https://en.wikipedia.org/wiki/Dilution_of_precision_(GPS))
- hdop: Horizontal [dilution of precision](https://en.wikipedia.org/wiki/Dilution_of_precision_(GPS))
- valid: Indicates if the checksum is okay

GLL - Geographic Position - Latitude/Longitude
---
The parsed object will have the following attributes:

- type: "GLL"
- lat: The latitude
- lon: The longitude
- status: Status active or void
- time: The time given as a JavaScript Date object
- valid: Indicates if the checksum is okay

GSV - List of Satellites in view
---
GSV messages are paginated. `msgNumber` indicates the current page and `msgsTotal` is the total number of pages.

The parsed object will have the following attributes:

- type: "GSV"
- msgNumber: Current page
- msgsTotal: Number of pages
- satellites: Array of satellite objects with the following attributes:
   - prn: Satellite PRN number
   - elevation: Elevation in degrees
   - azimuth: Azimuth in degrees
   - snr: Signal to Noise Ratio (higher is better)
- valid: Indicates if the checksum is okay


VTG - vector track and speed over ground
---

The parsed object will have the following attributes:

- type: "VTG"
- track: Track in degrees
- speed: Speed over ground in km/h
- faa: The FAA mode, introduced with NMEA 2.3
- valid: Indicates if the checksum is okay

ZDA - UTC day, month, and year, and local time zone offset
---

The parsed object will have the following attributes:

- type: "ZDA"
- time: The time given as a JavaScript Date object

GPS State
===
If the streaming API is not needed, but a solid state of the system, the `gps.state` object can be used. It has the following properties:

- time: Current time
- lat: Latitude
- lon: Longitude
- alt: Altitude
- satsActive: Array of active satellites
- speed: Speed over ground in km/h
- track: Track in degrees
- satsVisible: Array of all visible satellites

Adding new protocols is a matter of minutes. If you need a protocol which isn't implemented, I'm happy to see a pull request or a new ticket.


Troubleshooting
===
If you don't get valid position information after turning on the receiver, chances are high you simply have to wait as it takes some [time to first fix](https://en.wikipedia.org/wiki/Time_to_first_fix).

Functions
===

GPS.js comes with a few static functions, which help by working with geo-coordinates.

GPS.Parse(line)
---
Parses a single line and returns the resulting object, in case the callback system isn't needed/wanted

GPS.Distance(latFrom, lonFrom, latTo, lonTo)
---
Calculates the distance between two geo-coordinates using Haversine formula

GPS.Heading(latFrom, lonFrom, latTo, lonTo)
---
Calculates the angle from one coordinate to another. Heading is represented as windrose coordinates (N=0, E=90, S=189, W=270). The result can be used as the argument of [angles](https://github.com/infusion/Angles.js) `compass()` method:

```javascript
var angles = require('angles');
console.log(angles.compass(GPS.Heading(50, 10, 51, 9))); // will return x ∈ { N, S, E, W, NE, ... }
```


Using GPS.js with the browser
===
The use cases should be rare to parse NMEA directly inside the browser, but it works too.

```html
<script src="gps.js"></script>
<script>
   var gps = new GPS;
   gps.update('...');
</script>
```

Testing
===
If you plan to enhance the library, make sure you add test cases and all the previous tests are passing. You can test the library with

```
npm test
```

Copyright and licensing
===
Copyright (c) 2016, Robert Eisele (robert@xarg.org)
Dual licensed under the MIT or GPL Version 2 licenses.

