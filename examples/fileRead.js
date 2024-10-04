
var fs = require('fs');
var rs = fs.createReadStream('gps.dump');

var byline = require('byline');
var GPS = require('gps');
var gps = new GPS;

var stream = byline(rs);

// This filters all GGA packages from the dump
gps.on('GGA', function (gga) {

  console.log('Lat: ' + gga.lat);
  console.log('Lon: ' + gga.lon);
});

stream.on('data', function (data) {

  gps.update(data.toString());
});
