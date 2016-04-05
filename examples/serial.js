
// var file = '/dev/cu.usbserial';
// var file = '/dev/ttyUSB0';
//var file = '/dev/tty.usbserial';
var file = '/dev/tty.usbmodem1411';

var SerialPort = require('serialport');
var port = new SerialPort.SerialPort(file, {
  baudrate: 4800,
  parser: SerialPort.parsers.readline('\r\n')
});

var GPS = require('../gps.js');
var gps = new GPS;

gps.on('data', function(data) {
  console.log(data);
});

port.on('data', function(data) {
  gps.update(data);
});
