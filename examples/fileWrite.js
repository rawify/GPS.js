
// var file = '/dev/cu.usbserial';
// var file = '/dev/ttyUSB0';
var file = '/dev/tty.usbserial';

var SerialPort = require('serialport');
var port = new SerialPort.SerialPort(file, {
  baudrate: 4800,
  parser: SerialPort.parsers.readline('\r\n')
});

var fs = require('fs');
var ws = fs.createWriteStream('gps.dump');

var GPS = require('../gps.js');
var gps = new GPS;


port.on('open', function() {

  console.log('serial port open');

  gps.on('data', function(data) {
    ws.write(data.raw + '\n');
  });

  port.on('data', function(data) {
    gps.update(data);
  });
});
