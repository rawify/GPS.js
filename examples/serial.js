
// var file = '/dev/cu.usbserial';
// var file = '/dev/ttyUSB0';
//var file = '/dev/tty.usbserial';
var file = '/dev/tty.usbmodem1411';

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const parser = new ReadlineParser({
  delimiter: '\r\n'
});

const port = new SerialPort({
  path: file,
  baudRate: 4800
});

port.pipe(parser);


var GPS = require('gps');
var gps = new GPS;

gps.on('data', function (data) {
  console.log(data);
});

parser.on('data', function (data) {
  gps.update(data);
});
