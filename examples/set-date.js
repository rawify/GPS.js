
// var file = '/dev/cu.usbserial';
// var file = '/dev/ttyUSB0';
//var file = '/dev/tty.usbserial';
var file = '/dev/ttyACM0';

var exec = require('child_process').exec;

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

  if (!data.time)
    return;

  exec('date -s "' + data.time.toString() + '"', function (error, stdout, stderr) {
    if (error) throw error;
    // Clock should be set now, exit
    console.log("Set time to " + data.time.toString());
    process.exit();
  });
});

parser.on('data', function (data) {
  gps.update(data);
});


