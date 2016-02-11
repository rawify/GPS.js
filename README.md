
![GPS.js](https://github.com/infusion/GPS.js/blob/master/logo.png?raw=true "Javascript GPS Parser")

[![NPM Package](https://img.shields.io/npm/v/gps.js.svg?style=flat)](https://npmjs.org/package/gps.js "View this project on npm")
[![Build Status](https://travis-ci.org/infusion/GPS.js.svg?branch=master)](https://travis-ci.org/infusion/GPS.js)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

GPS.js is a stream parser for [NMEA](http://www.gpsinformation.org/dale/nmea.htm) sentences, given by any common GPS receiver. The output is tried to be as high-level as possible. 


Usage
===

The interface of GPS.js is as simple as the following few lines. You need to add an event-listener for the completion of the task and invoke the update method with a sentence you want to process. There are much more examples in the examples folder.

```javascript
var gps = new GPS;

// Add an event listener on all protocols
gps.on('data', function(raw, parsed) {
    
    console.log(parsed);
});

// Call the update routine directly with a NMEA sentence, which would
// come from the serial port or stream-reader normally
gps.update("$GPGGA,224900.000,4832.3762,N,00903.5393,E,1,04,7.8,498.6,M,48.0,M,,0000*5E");
```

It's also possible to add event-listeners only on one of the following protocols, by stating `gps.on('GGA', ...)` for example.

Installation
===
Installing GPS.js is as easy as cloning this repo or use the following command:

```
npm install gps.js
```


Examples
===

GPS.js comes with some examples, like drawing the current latutude and longitude to Google Maps, displaying a persistent state and displaying the parsed raw data. In some cases you have to adjust the serial path to your own GPS receiver to make it work.

Dashboard
---
Go into the folder `examples/dashboard` and start the server with

```
node server
```

After that you can open the browser and go to http://localhost:3000

Google Maps
---
Go into the folder `examples/maps` and start the server with

```
node server
```

After that you can open the browser and go to http://localhost:3000


Protocols
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


GPS State
===
If the streaming API is not needed, but a solid state of the system, the `gps.state` object can be used. It has the following properties:

- time: Current time
- lat: Latitude
- lon: Longitude
- alt: Altitude
- sats_active: Array of active satellites
- speed: Speed over ground in km/h
- track: Track in degrees
- sats_visible: Array of all visible satellites

Adding new protocols is a matter of minutes. If you need a protocol which isn't implemented, I'm happy to see a pull request or a new ticket.

Using GPS.js with the browser
===
The use cases should be rare to parse NMEA directly inside the browser, but it works too.

```
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


