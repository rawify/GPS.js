
// var file = '/dev/cu.usbserial';
// var file = '/dev/ttyUSB0';
//var file = '/dev/tty.usbserial';
var file = '/dev/ttyACM0';

var exec = require('child_process').exec;

var SerialPort = require('serialport');
var port = new SerialPort.SerialPort(file, {
  baudrate: 4800,
  parser: SerialPort.parsers.readline('\r\n')
});

var GPS = require('../gps.js');
var gps = new GPS;

gps.on('data', function(data) {

  if (!data.time)
    return;

  exec('date -s "' + data.time.toString() + '"', function(error, stdout, stderr) {
    if (error) throw error;
    // Clock should be set now, exit
    console.log("Set time to " + data.time.toString());
    process.exit();
  });
});

port.on('data', function(data) {
  gps.update(data);
});


