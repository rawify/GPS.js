

var GPS = require('gps');
var gps = new GPS;

var sentence = '$GPGGA,224900.000,4832.3762,N,00903.5393,E,1,04,7.8,498.6,M,48.0,M,,0000*5E';

gps.on('data', function (parsed) {

  console.log(parsed);
});

gps.update(sentence);