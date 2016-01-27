
var expect = require('chai').expect;


var GPS = require('../gps.js');
var gps = new GPS;

var tests = {
    "$GPGSA,A,3,29,26,31,21,,,,,,,,,2.0,1.7,1.0*39": {
        "fix": "3D",
        "hdop": 1,
        "mode": "auto",
        "pdop": 2,
        "satellites": [
            29,
            26,
            31,
            21
        ],
        "type": "GSA",
        "valid": true,
        "vdop": 1.7
    },
    "$GPRMC,234919.000,A,4832.3914,N,00903.5500,E,2.28,2.93,260116,,*0D": {
        "lat": 48.539856666666665,
        "lon": 9.059166666666666,
        "speed": 4.22256,
        "status": "active",
        "time": new Date("2016-01-26T23:49:19.000Z"),
        "track": 2.93,
        "type": "RMC",
        "valid": true,
        "variation": null
    },
    "$GPVTG,2.93,T,,M,2.28,N,4.2,K*66": {
        "speed": 4.22256,
        "track": 2.93,
        "type": "VTG",
        "valid": true
    },
    "$GPGGA,234920.000,4832.3918,N,00903.5488,E,1,05,1.7,437.9,M,48.0,M,,0000*51": {
        "age": null,
        "alt": 437.9,
        "geoidal": 48,
        "hdop": 1.7,
        "lat": 48.53986333333334,
        "lon": 9.059146666666667,
        "quality": "fix",
        "satelites": 5,
        "stationID": 0,
        "time": new Date("2016-01-27T23:49:20.000Z"),
        "type": "GGA",
        "valid": true
    }
};

describe('Should pass NMEA sentences', function() {

    gps.on('data', function(raw, data) {

        it("Should pass " + raw, function() {

            expect(data).to.deep.equal(tests[raw]);
        });
    });
});

for (var i in tests) {
    gps.update(i);
}
