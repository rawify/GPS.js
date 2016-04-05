
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// var file = '/dev/cu.usbserial';
// var file = '/dev/ttyUSB0';
//var file = '/dev/tty.usbserial';
var file = '/dev/tty.usbmodem1411';

var SerialPort = require('serialport');
var port = new SerialPort.SerialPort(file, {
  baudrate: 4800,
  parser: SerialPort.parsers.readline('\r\n')
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/dashboard.html');
});

var GPS = require('../../gps.js');
var gps = new GPS;

http.listen(3000, function() {

  console.log('listening on *:3000');

  port.on('open', function() {
    console.log('GPS listening');

    gps.on('data', function(raw, data) {
      io.emit('state', gps.state);
    });

    port.on('data', function(data) {
      gps.update(data);
    });
  });
});
