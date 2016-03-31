
function _(x) {
  return x < 10 ? "0" + x : x;
}

var today = new Date();
today = today.getFullYear() + '-' + _(today.getMonth() + 1) + '-' + _(today.getDate());

var expect = require('chai').expect;
var GPS = require('../gps.js');
var gps = new GPS;
var tests = {
  'foo': 'invalid',
  '$GPGSA,A,3,29,26,31,21,,,,,,,,,2.0,1.7,1.0*39': {
    'fix': '3D',
    'hdop': 1.7,
    'mode': 'automatic',
    'pdop': 2,
    'raw': '$GPGSA,A,3,29,26,31,21,,,,,,,,,2.0,1.7,1.0*39',
    'satellites': [
      29,
      26,
      31,
      21
    ],
    'type': 'GSA',
    'valid': true,
    'vdop': 1
  },
  '$GPRMC,234919.000,A,4832.3914,N,00903.5500,E,2.28,2.93,260116,,*0D': {
    'lat': 48.539856666666665,
    'lon': 9.059166666666666,
    'speed': 4.22256,
    'status': 'active',
    'time': new Date('2016-01-26T23:49:19.000Z'),
    'track': 2.93,
    'raw': '$GPRMC,234919.000,A,4832.3914,N,00903.5500,E,2.28,2.93,260116,,*0D',
    'type': 'RMC',
    'faa': null,
    'valid': true,
    'variation': null
  },
  '$GPVTG,2.93,T,,M,2.28,N,4.2,K*66': {
    'speed': 4.22256,
    'track': 2.93,
    'raw': '$GPVTG,2.93,T,,M,2.28,N,4.2,K*66',
    'type': 'VTG',
    'faa': null,
    'valid': true
  },
  '$GPGGA,234920.000,4832.3918,N,00903.5488,E,1,05,1.7,437.9,M,48.0,M,,0000*51': {
    'age': null,
    'alt': 437.9,
    'geoidal': 48,
    'hdop': 1.7,
    'lat': 48.53986333333334,
    'lon': 9.059146666666667,
    'quality': 'fix',
    'raw': '$GPGGA,234920.000,4832.3918,N,00903.5488,E,1,05,1.7,437.9,M,48.0,M,,0000*51',
    'satelites': 5,
    'stationID': 0,
    'time': new Date(today + 'T23:49:20.000Z'),
    'type': 'GGA',
    'valid': true
  },
  '$GPGGA,123519,4807.038,N,01131.324,E,1,08,0.9,545.4,M,46.9,M, , *42': {
    'age': NaN,
    'alt': 545.4,
    'geoidal': 46.9,
    'hdop': 0.9,
    'lat': 48.1173,
    'raw': '$GPGGA,123519,4807.038,N,01131.324,E,1,08,0.9,545.4,M,46.9,M, , *42',
    'lon': 11.522066666666667,
    'quality': 'fix',
    'satelites': 8,
    'stationID': NaN,
    'time': new Date(today + 'T12:35:19.000Z'),
    'type': 'GGA',
    'valid': true,
  },
  '$GPGGA,123519,4807.038,N,01131.324,E,1,08,0.9,545.4,M,46.9,M,,': 'invalid',
  '$GPRMC,081836,A,3751.65,S,14507.36,E,000.0,360.0,130998,011.3,E*62': {
    'lat': -37.86083333333333,
    'lon': 145.12266666666667,
    'speed': 0,
    'status': 'active',
    'raw': '$GPRMC,081836,A,3751.65,S,14507.36,E,000.0,360.0,130998,011.3,E*62',
    'time': new Date('2098-09-13T08:18:36.000Z'),
    'track': 360,
    'type': 'RMC',
    'faa': null,
    'valid': true,
    'variation': 11.3
  },
  '$GPGSV,3,2,12,16,17,148,46,20,61,307,51,23,36,283,47,25,06,034,00*78': {
    'msgNumber': 2,
    'raw': '$GPGSV,3,2,12,16,17,148,46,20,61,307,51,23,36,283,47,25,06,034,00*78',
    'msgsTotal': 3,
    'satellites': [
      {
        'azimuth': 148,
        'elevation': 17,
        'prn': 16,
        'snr': 46,
        'status': 'tracking'
      }, {
        'azimuth': 307,
        'elevation': 61,
        'prn': 20,
        'snr': 51,
        'status': 'tracking'
      }, {
        'azimuth': 283,
        'elevation': 36,
        'prn': 23,
        'snr': 47,
        'status': 'tracking'
      }, {
        'azimuth': 34,
        'elevation': 6,
        'prn': 25,
        'snr': 0,
        'status': 'tracking'
      }
    ],
    'type': 'GSV',
    'valid': true
  },
  '$GPGGA,092750.000,5321.6802,N,00630.3372,W,1,8,1.03,61.7,M,55.2,M,,*76': {
    'age': null,
    'alt': 61.7,
    'geoidal': 55.2,
    'hdop': 1.03,
    'lat': 53.361336666666666,
    'lon': -6.50562,
    'quality': 'fix',
    'raw': '$GPGGA,092750.000,5321.6802,N,00630.3372,W,1,8,1.03,61.7,M,55.2,M,,*76',
    'satelites': 8,
    'stationID': null,
    'time': new Date(today + 'T09:27:50.000Z'),
    'type': 'GGA',
    'valid': true
  },
  '$GPZDA,201530.00,04,07,2002,00,00*60': {
    'raw': '$GPZDA,201530.00,04,07,2002,00,00*60',
    'time': new Date('2002-07-04T20:15:30.000Z'),
    'type': 'ZDA',
    'valid': true
  },
  '$GPGSA,A,3,10,07,05,02,29,04,08,13,,,,,1.72,1.03,1.38*0A': {
    'fix': '3D',
    'hdop': 1.03,
    'mode': 'automatic',
    'pdop': 1.72,
    'raw': '$GPGSA,A,3,10,07,05,02,29,04,08,13,,,,,1.72,1.03,1.38*0A',
    'satellites': [
      10,
      7,
      5,
      2,
      29,
      4,
      8,
      13
    ],
    'type': 'GSA',
    'valid': true,
    'vdop': 1.38
  },
  '$GPGSV,3,1,11,10,63,137,17,07,61,098,15,05,59,290,20,08,54,157,30*70': {
    'msgNumber': 1,
    'msgsTotal': 3,
    'raw': '$GPGSV,3,1,11,10,63,137,17,07,61,098,15,05,59,290,20,08,54,157,30*70',
    'satellites': [
      {
        'azimuth': 137,
        'elevation': 63,
        'prn': 10,
        'snr': 17,
        'status': 'tracking'
      }, {
        'azimuth': 98,
        'elevation': 61,
        'prn': 7,
        'snr': 15,
        'status': 'tracking'
      }, {
        'azimuth': 290,
        'elevation': 59,
        'prn': 5,
        'snr': 20,
        'status': 'tracking'
      }, {
        'azimuth': 157,
        'elevation': 54,
        'prn': 8,
        'snr': 30,
        'status': 'tracking'
      }
    ],
    'type': 'GSV',
    'valid': true
  },
  '$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A': {
    'faa': null,
    'lat': 48.1173,
    'lon': 11.516666666666667,
    'raw': '$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A',
    'speed': 41.4848,
    'status': 'active',
    'time': new Date('2094-03-23T12:35:19.000Z'),
    'track': 84.4,
    'type': 'RMC',
    'valid': true,
    'variation': -3.1
  },
  //'$GPVTG,210.43,T,210.43,M,5.65,N,,,A*67': {},
  '$GPGGA,123519,4807.04,N,1131.00,E,1,8,0.9,545.9,M,46.9,M,,*45': {
    'age': null,
    'alt': 545.9,
    'geoidal': 46.9,
    'hdop': 0.9,
    'lat': 48.117333333333335,
    'lon': 113.01666666666667,
    'quality': 'fix',
    'raw': '$GPGGA,123519,4807.04,N,1131.00,E,1,8,0.9,545.9,M,46.9,M,,*45',
    'satelites': 8,
    'stationID': null,
    'time': new Date(today + 'T12:35:19.000Z'),
    'type': 'GGA',
    'valid': true
  },
  '$GPGSA,A,3,12,05,25,29,,,,,,,,,9.4,7.6,5.6*37': {
    'fix': '3D',
    'hdop': 7.6,
    'mode': 'automatic',
    'pdop': 9.4,
    'raw': '$GPGSA,A,3,12,05,25,29,,,,,,,,,9.4,7.6,5.6*37',
    'satellites': [
      12,
      5,
      25,
      29
    ],
    'type': 'GSA',
    'valid': true,
    'vdop': 5.6
  },
  '$GPGSV,3,1,11,03,03,111,00,04,15,270,00,06,01,010,00,13,06,292,00*74': {
    'msgNumber': 1,
    'msgsTotal': 3,
    'raw': '$GPGSV,3,1,11,03,03,111,00,04,15,270,00,06,01,010,00,13,06,292,00*74',
    'satellites': [
      {
        'azimuth': 111,
        'elevation': 3,
        'prn': 3,
        'snr': 0,
        'status': 'tracking'
      }, {
        'azimuth': 270,
        'elevation': 15,
        'prn': 4,
        'snr': 0,
        'status': 'tracking'
      }, {
        'azimuth': 10,
        'elevation': 1,
        'prn': 6,
        'snr': 0,
        'status': 'tracking'
      }, {
        'azimuth': 292,
        'elevation': 6,
        'prn': 13,
        'snr': 0,
        'status': 'tracking'
      }
    ],
    'type': 'GSV',
    'valid': true
  },
  '$GPGSV,3,2,11,14,25,170,00,16,57,208,39,18,67,296,40,19,40,246,00*2D': {
    'msgNumber': 2,
    'msgsTotal': 3,
    'raw': '$GPGSV,3,2,11,14,25,170,00,16,57,208,39,18,67,296,40,19,40,246,00*2D',
    'satellites': [
      {
        'azimuth': 170,
        'elevation': 25,
        'prn': 14,
        'snr': 0,
        'status': 'tracking'
      }, {
        'azimuth': 208,
        'elevation': 57,
        'prn': 16,
        'snr': 39,
        'status': 'tracking'
      }, {
        'azimuth': 296,
        'elevation': 67,
        'prn': 18,
        'snr': 40,
        'status': 'tracking'
      }, {
        'azimuth': 246,
        'elevation': 40,
        'prn': 19,
        'snr': 0,
        'status': 'tracking'
      }
    ],
    'type': 'GSV',
    'valid': false
  },
  '$GPGSV,3,2,11,02,39,223,16,13,28,070,17,26,23,252,,04,14,186,15*77': {
    'msgNumber': 2,
    'msgsTotal': 3,
    'raw': '$GPGSV,3,2,11,02,39,223,16,13,28,070,17,26,23,252,,04,14,186,15*77',
    'satellites': [
      {
        'azimuth': 223,
        'elevation': 39,
        'prn': 2,
        'snr': 16,
        'status': 'tracking'
      }, {
        'azimuth': 70,
        'elevation': 28,
        'prn': 13,
        'snr': 17,
        'status': 'tracking'
      }, {
        'azimuth': 252,
        'elevation': 23,
        'prn': 26,
        'snr': null,
        'status': 'in view'
      }, {
        'azimuth': 186,
        'elevation': 14,
        'prn': 4,
        'snr': 15,
        'status': 'tracking'
      }
    ],
    'type': 'GSV',
    'valid': true
  },
  '$GPGSV,3,3,11,29,09,301,24,16,09,020,,36,,,*76': {
    'msgNumber': 3,
    'msgsTotal': 3,
    'raw': '$GPGSV,3,3,11,29,09,301,24,16,09,020,,36,,,*76',
    'satellites': [
      {
        'azimuth': 301,
        'elevation': 9,
        'prn': 29,
        'snr': 24,
        'status': 'tracking'
      }, {
        'azimuth': 20,
        'elevation': 9,
        'prn': 16,
        'snr': null,
        'status': 'in view'
      }, {
        'azimuth': null,
        'elevation': null,
        'prn': 36,
        'snr': null,
        'status': 'in view'
      }
    ],
    'type': 'GSV',
    'valid': true
  },
  '$GPRMC,092750.000,A,5321.6802,N,00630.3372,W,0.02,31.66,280511,,,A*43': {
    'faa': 'autonomous',
    'lat': 53.361336666666666,
    'lon': -6.50562,
    'raw': '$GPRMC,092750.000,A,5321.6802,N,00630.3372,W,0.02,31.66,280511,,,A*43',
    'speed': 0.037040000000000003,
    'status': 'active',
    'time': new Date('2011-05-28T09:27:50.000Z'),
    'track': 31.66,
    'type': 'RMC',
    'valid': true,
    'variation': null
  },
  '$GPGGA,092751.000,5321.6802,N,00630.3371,W,1,8,1.03,61.7,M,55.3,M,,*75': {
    'age': null,
    'alt': 61.7,
    'geoidal': 55.3,
    'hdop': 1.03,
    'lat': 53.361336666666666,
    'lon': -6.5056183333333335,
    'quality': 'fix',
    'raw': '$GPGGA,092751.000,5321.6802,N,00630.3371,W,1,8,1.03,61.7,M,55.3,M,,*75',
    'satelites': 8,
    'stationID': null,
    'time': new Date(today + 'T09:27:51.000Z'),
    'type': 'GGA',
    'valid': true
  },
  '$GPRMC,092751.000,A,5321.6802,N,00630.3371,W,0.06,31.66,280511,,,A*45': {
    'faa': 'autonomous',
    'lat': 53.361336666666666,
    'lon': -6.5056183333333335,
    'raw': '$GPRMC,092751.000,A,5321.6802,N,00630.3371,W,0.06,31.66,280511,,,A*45',
    'speed': 0.11112,
    'status': 'active',
    'time': new Date('2011-05-28T09:27:51.000Z'),
    'track': 31.66,
    'type': 'RMC',
    'valid': true,
    'variation': null
  },
  '$GPGLL,6005.068,N,02332.341,E,095601,A,D*42': {
    'lat': 60.084466666666664,
    'lon': 23.539016666666665,
    'raw': '$GPGLL,6005.068,N,02332.341,E,095601,A,D*42',
    'status': 'active',
    'time': new Date(today + 'T09:56:01.000Z'),
    'type': 'GLL',
    'valid': true
  },
  '$GPGLL,4916.45,N,12311.12,W,225444,A,*1D': {
    'lat': 49.274166666666666,
    'lon': -123.18533333333333,
    'raw': '$GPGLL,4916.45,N,12311.12,W,225444,A,*1D',
    'status': 'active',
    'time': new Date(today + 'T22:54:44.000Z'),
    'type': 'GLL',
    'valid': true
  }
};
var collect = {};
gps.on('data', function(raw, data) {

  collect[raw] = data;
});
for (var i in tests) {

  if (!gps.update(i)) {
    collect[i] = 'invalid';
  }
}

describe('NMEA syntax', function() {

  for (var i in collect) {

    (function(i) {

      it('Should pass ' + i, function() {
        expect(collect[i]).to.deep.equal(tests[i]);
      });
    })(i);
  }
});
/*
 $IIDBT,036.41,f,011.10,M,005.99,F*25
 $IIMWV,017,R,02.91,N,A*2F
 $XXMWV,017.00,R,2.91,N,A*31
 $IIVTG,210.43,T,210.43,M,5.65,N,,,A*67
 $XXVTG,210.43,T,209.43,M,2.91,N,,,A*63
 $GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47
 '$GPGSA,A,1,,,,,,,,,,,,,,,*1E',
 '$GPGSV,3,1,12,29,75,266,39,05,48,047,,26,43,108,,15,35,157,*78',
 '$GPGSV,3,2,12,21,30,292,,18,21,234,,02,18,093,,25,13,215,*7F',
 '$GPGSV,3,3,12,30,11,308,,16,,333,,12,,191,,07,-4,033,*62',
 '$GPRMC,085542.023,V,,,,,,,041211,,,N*45',
 '$GPGGA,085543.023,,,,,0,00,,,M,0.0,M,,0000*58',
 '$IIBWC,160947,6008.160,N,02454.290,E,162.4,T,154.3,M,001.050,N,DEST*1C',
 '$IIAPB,A,A,0.001,L,N,V,V,154.3,M,DEST,154.3,M,154.2,M*19'
 $GPGGA,100313.99,3344.459045,N,09639.616711,W,1,05,0.0,220.9,M,0.0,M,0.0,0000*66
 $GPGGA,092750.000,5321.6802,N,00630.3372,W,1,8,1.03,61.7,M,55.2,M,,*76
 $GPGGA,181650.692,7204.589,N,01915.106,W,0,00,,,M,,M,,*59
 $GPGGA,092751.000,5321.6802,N,00630.3371,W,1,8,1.03,61.7,M,55.3,M,,*75
 $GPGGA,181514.692,4951.923,S,03050.357,W,0,00,,,M,,M,,*4F
 */
