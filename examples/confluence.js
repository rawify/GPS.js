

// var file = '/dev/cu.usbserial';
// var file = '/dev/ttyUSB0';
//var file = '/dev/tty.usbserial';
var file = '/dev/tty.usbmodem1411';

const SerialPort = require('serialport');
const parsers = SerialPort.parsers;

const parser = new parsers.Readline({
  delimiter: '\r\n'
});

const port = new SerialPort(file, {
  baudRate: 4800
});

port.pipe(parser);


var Angles = require('angles');
var GPS = require('../gps.js');
var gps = new GPS;

gps.on('data', function(data) {

  var lat1 = gps.state.lat;
  var lon1 = gps.state.lon;

  // Find closest confluence point as destination
  var lat2 = Math.round(lat1);
  var lon2 = Math.round(lon1);

  var dist = GPS.Distance(lat1, lon1, lat2, lon2);
  var head = GPS.Heading(lat1, lon1, lat2, lon2);
  var rose = Angles.compass(head);

  console.log("\033[2J\033[;H" + 
  "You are at (" + lat1 + ", " + lon1 + "),\n" +
  "The closest confluence point (" + lat2 + ", " + lon2 + ") is in " + dist + " km.\n" +
  "You have to go " + head + "° " + rose);

});

parser.on('data', function(data) {
  gps.update(data);
});
