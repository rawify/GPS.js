
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

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


var GPS = require('../../gps.js');
var gps = new GPS;

gps.on('GGA', function(data) {
  io.emit('position', data);
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/maps.html');
});

http.listen(3000, function() {

  console.log('listening on *:3000');
});

parser.on('data', function(data) {
  gps.update(data);
});
