
var fs = require('fs');
var rs = fs.createReadStream('gps.dump');

var stream = require('stream-line');
var GPS = require('../gps.js');
var gps = new GPS;

rs.pipe(stream);

// This filters all GGA packages from the dump
gps.on('GGA', function(gga) {

    console.log("Lat: " + gga.lat);
    console.log("Lon: " + gga.lon);
});

stream.on('data', function(line) {

    gps.update(line);
});
