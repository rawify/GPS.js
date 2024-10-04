
const GPS = require('gps');
const assert = require('assert');
const gps = new GPS;

const res = [{
  'lat': 48.539856666666665,
  'lon': 9.059166666666666,
  'speed': 4.22256,
  'status': 'active',
  'time': new Date('2016-01-26T23:49:19.000Z'),
  'track': 2.93,
  'raw': '$GPRMC,234919.000,A,4832.3914,N,00903.5500,E,2.28,2.93,260116,,*0D',
  'type': 'RMC',
  'faa': null,
  "navStatus": null,
  'valid': true,
  'variation': null
}, {
  'speed': 4.22256,
  'track': 2.93,
  'trackMagnetic': null,
  'raw': '$GPVTG,2.93,T,,M,2.28,N,4.2,K*66',
  'type': 'VTG',
  'faa': null,
  'valid': true
}
];

describe('partial updates', function () {

  it('should work async with partial updates', function (done) {

    var K = 0;

    gps.on('data', function (data) {

      try {
        assert.deepEqual(data, res[K++]);
      } catch (e) {
        done(e);
        return;
      }

      if (K === res.length) {
        done();
        return;
      }
    });

    gps.updatePartial("6,,*0D\r\n$GPRMC,234919.000");
    gps.updatePartial(",A,4832.3914,N,00903.5500");
    gps.updatePartial(",E,2.28,2.93,260116,,*0D\r\n$GPVTG,2.");
    gps.updatePartial("93,T,,M,2.28,N,4.2,K*66\r\nfoo");

  });
});
