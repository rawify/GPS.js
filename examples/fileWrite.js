
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

var fs = require('fs');
var ws = fs.createWriteStream('gps.dump');

var GPS = require('gps');
var gps = new GPS;

gps.on('data', function (data) {
  ws.write(data.raw + '\n');
});

parser.on('data', function (data) {
  gps.update(data);
});
