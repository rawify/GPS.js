
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// var file = '/dev/cu.usbserial';
// var file = '/dev/ttyUSB0';
//var file = '/dev/tty.usbserial';
const file = '/dev/tty.usbmodem1421';

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

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/dashboard.html');
});

var GPS = require('gps');
var gps = new GPS;
gps.state.bearing = 0;
var prev = { lat: null, lon: null };

http.listen(3000, function () {

  console.log('listening on *:3000');

  gps.on('data', function () {
    if (prev.lat !== null && prev.lon !== null) {
      gps.state.bearing = GPS.Heading(prev.lat, prev.lon, gps.state.lat, gps.state.lon);
    }
    io.emit('state', gps.state);
    prev.lat = gps.state.lat;
    prev.lon = gps.state.lon;
    ;
  });

  parser.on('data', function (data) {
    gps.update(data);
  });
});
