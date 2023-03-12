
function _(x) {
  return x < 10 ? "0" + x : x;
}

let today = new Date();
today = today.getUTCFullYear() + '-' + _(today.getUTCMonth() + 1) + '-' + _(today.getUTCDate());

const GPS = require('gps');
const assert = require('assert');
const gps = new GPS;
const tests = {
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
    "system": "unknown",
    "systemId": null,
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
    "navStatus": null,
    'raw': '$GPRMC,234919.000,A,4832.3914,N,00903.5500,E,2.28,2.93,260116,,*0D',
    'type': 'RMC',
    'faa': null,
    'valid': true,
    'variation': null
  },
  '$GPVTG,2.93,T,,M,2.28,N,4.2,K*66': {
    'speed': 4.22256,
    'track': 2.93,
    'trackMagnetic': null,
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
    'satellites': 5,
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
    'satellites': 8,
    'stationID': NaN,
    'time': new Date(today + 'T12:35:19.000Z'),
    'type': 'GGA',
    'valid': true
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
    "navStatus": null,
    'faa': null,
    'valid': true,
    'variation': 11.3
  },
  '$GPGSV,3,2,12,16,17,148,46,20,61,307,51,23,36,283,47,25,06,034,00*78': {
    'msgNumber': 2,
    'raw': '$GPGSV,3,2,12,16,17,148,46,20,61,307,51,23,36,283,47,25,06,034,00*78',
    'msgsTotal': 3,
    "satsInView": 12,
    'signalId': null,
    "system": "GPS",
    'satellites': [
      {
        'azimuth': 148,
        'elevation': 17,
        "key": "GP16",
        'prn': 16,
        'snr': 46,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 307,
        'elevation': 61,
        "key": "GP20",
        'prn': 20,
        'snr': 51,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 283,
        'elevation': 36,
        "key": "GP23",
        'prn': 23,
        'snr': 47,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 34,
        'elevation': 6,
        "key": "GP25",
        'prn': 25,
        'snr': 0,
        'status': 'tracking',
        "system": "GPS"
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
    'satellites': 8,
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
    "systemId": null,
    "system": "unknown",
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
    "satsInView": 11,
    'signalId': null,
    "system": "GPS",
    'raw': '$GPGSV,3,1,11,10,63,137,17,07,61,098,15,05,59,290,20,08,54,157,30*70',
    'satellites': [
      {
        'azimuth': 137,
        'elevation': 63,
        "key": "GP10",
        'prn': 10,
        'snr': 17,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 98,
        'elevation': 61,
        "key": "GP7",
        'prn': 7,
        'snr': 15,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 290,
        'elevation': 59,
        "key": "GP5",
        'prn': 5,
        'snr': 20,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 157,
        'elevation': 54,
        "key": "GP8",
        'prn': 8,
        'snr': 30,
        'status': 'tracking',
        "system": "GPS"
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
    "navStatus": null,
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
    'satellites': 8,
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
    "systemId": null,
    'satellites': [
      12,
      5,
      25,
      29
    ],
    "system": "unknown",
    'type': 'GSA',
    'valid': true,
    'vdop': 5.6
  },
  '$GPGSV,3,1,11,03,03,111,00,04,15,270,00,06,01,010,00,13,06,292,00*74': {
    'msgNumber': 1,
    'msgsTotal': 3,
    "satsInView": 11,
    'signalId': null,
    'raw': '$GPGSV,3,1,11,03,03,111,00,04,15,270,00,06,01,010,00,13,06,292,00*74',
    'satellites': [
      {
        'azimuth': 111,
        'elevation': 3,
        "key": "GP3",
        'prn': 3,
        'snr': 0,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 270,
        'elevation': 15,
        "key": "GP4",
        'prn': 4,
        'snr': 0,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 10,
        'elevation': 1,
        "key": "GP6",
        'prn': 6,
        'snr': 0,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 292,
        'elevation': 6,
        "key": "GP13",
        'prn': 13,
        'snr': 0,
        'status': 'tracking',
        "system": "GPS"
      }
    ],
    "system": "GPS",
    'type': 'GSV',
    'valid': true
  },
  '$GPGSV,3,2,11,14,25,170,00,16,57,208,39,18,67,296,40,19,40,246,00*2D': {
    'msgNumber': 2,
    'msgsTotal': 3,
    "satsInView": 11,
    'signalId': null,
    'raw': '$GPGSV,3,2,11,14,25,170,00,16,57,208,39,18,67,296,40,19,40,246,00*2D',
    'satellites': [
      {
        'azimuth': 170,
        'elevation': 25,
        "key": "GP14",
        'prn': 14,
        'snr': 0,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 208,
        'elevation': 57,
        "key": "GP16",
        'prn': 16,
        'snr': 39,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 296,
        'elevation': 67,
        "key": "GP18",
        'prn': 18,
        'snr': 40,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 246,
        'elevation': 40,
        "key": "GP19",
        'prn': 19,
        'snr': 0,
        'status': 'tracking',
        "system": "GPS"
      }
    ],
    'type': 'GSV',
    "system": "GPS",
    'valid': false
  },
  '$GPGSV,3,2,11,02,39,223,16,13,28,070,17,26,23,252,,04,14,186,15*77': {
    'msgNumber': 2,
    'msgsTotal': 3,
    "satsInView": 11,
    'signalId': null,
    'raw': '$GPGSV,3,2,11,02,39,223,16,13,28,070,17,26,23,252,,04,14,186,15*77',
    'satellites': [
      {
        'azimuth': 223,
        'elevation': 39,
        "key": "GP2",
        'prn': 2,
        'snr': 16,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 70,
        'elevation': 28,
        "key": "GP13",
        'prn': 13,
        'snr': 17,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 252,
        'elevation': 23,
        "key": "GP26",
        'prn': 26,
        'snr': null,
        'status': 'in view',
        "system": "GPS"
      }, {
        'azimuth': 186,
        'elevation': 14,
        "key": "GP4",
        'prn': 4,
        'snr': 15,
        'status': 'tracking',
        "system": "GPS"
      }
    ],
    'type': 'GSV',
    "system": "GPS",
    'valid': true
  },
  '$GPGSV,3,3,11,29,09,301,24,16,09,020,,36,,,*76': {
    'msgNumber': 3,
    'msgsTotal': 3,
    "satsInView": 11,
    'signalId': null,
    'raw': '$GPGSV,3,3,11,29,09,301,24,16,09,020,,36,,,*76',
    'satellites': [
      {
        'azimuth': 301,
        'elevation': 9,
        "key": "GP29",
        'prn': 29,
        'snr': 24,
        'status': 'tracking',
        "system": "GPS"
      }, {
        'azimuth': 20,
        'elevation': 9,
        "key": "GP16",
        'prn': 16,
        'snr': null,
        'status': 'in view',
        "system": "GPS"
      }, {
        'azimuth': null,
        'elevation': null,
        "key": "GP36",
        'prn': 36,
        'snr': null,
        'status': 'in view',
        "system": "GPS"
      }
    ],
    'type': 'GSV',
    "system": "GPS",
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
    "navStatus": null,
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
    'satellites': 8,
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
    "navStatus": null,
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
    'valid': true,
    "faa": "differential"
  },
  '$GPGLL,4916.45,N,12311.12,W,225444,A,*1D': {
    'lat': 49.274166666666666,
    'lon': -123.18533333333333,
    'raw': '$GPGLL,4916.45,N,12311.12,W,225444,A,*1D',
    'status': 'active',
    'time': new Date(today + 'T22:54:44.000Z'),
    'type': 'GLL',
    'valid': true,
    'faa': null
  },
  '$GPGGA,174815.40,4141.46474,N,00849.77225,W,1,08,1.24,11.8,M,50.5,M,,*76': {
    'age': null,
    'alt': 11.8,
    'geoidal': 50.5,
    'hdop': 1.24,
    'quality': 'fix',
    'satellites': 8,
    'stationID': null,
    'lat': 41.691079,
    'lon': -8.8295375,
    'time': new Date(today + 'T17:48:15.400Z'),
    'raw': '$GPGGA,174815.40,4141.46474,N,00849.77225,W,1,08,1.24,11.8,M,50.5,M,,*76',
    'type': 'GGA',
    'valid': true,
  },
  // test with two digits on quality
  '$GPGGA,174815.40,4141.46474,N,00849.77225,W,05,08,1.24,11.8,M,50.5,M,,*42': {
    'age': null,
    'alt': 11.8,
    'geoidal': 50.5,
    'hdop': 1.24,
    'quality': 'rtk-float',
    'satellites': 8,
    'stationID': null,
    'lat': 41.691079,
    'lon': -8.8295375,
    'time': new Date(today + 'T17:48:15.400Z'),
    'raw': '$GPGGA,174815.40,4141.46474,N,00849.77225,W,05,08,1.24,11.8,M,50.5,M,,*42',
    'type': 'GGA',
    'valid': true,
  },
  '$GPGST,172814.0,0.006,0.023,0.020,273.6,0.023,0.020,0.031*6A': {
    'time': new Date(today + 'T17:28:14.000Z'),
    'rms': 0.006,
    'ellipseMajor': 0.023,
    'ellipseMinor': 0.020,
    'ellipseOrientation': 273.6,
    'latitudeError': 0.023,
    'longitudeError': 0.020,
    'heightError': 0.031,
    'raw': '$GPGST,172814.0,0.006,0.023,0.020,273.6,0.023,0.020,0.031*6A',
    'type': 'GST',
    'valid': true
  },
  '$GLGST,172814.0,0.006,0.023,0.020,273.6,0.023,0.020,0.031*76': {
    'time': new Date(today + 'T17:28:14.000Z'),
    'rms': 0.006,
    'ellipseMajor': 0.023,
    'ellipseMinor': 0.020,
    'ellipseOrientation': 273.6,
    'latitudeError': 0.023,
    'longitudeError': 0.020,
    'heightError': 0.031,
    'raw': '$GLGST,172814.0,0.006,0.023,0.020,273.6,0.023,0.020,0.031*76',
    'type': 'GST',
    'valid': true
  },
  '$GNGST,172814.0,0.006,0.023,0.020,273.6,0.023,0.020,0.031*74': {
    'time': new Date(today + 'T17:28:14.000Z'),
    'rms': 0.006,
    'ellipseMajor': 0.023,
    'ellipseMinor': 0.020,
    'ellipseOrientation': 273.6,
    'latitudeError': 0.023,
    'longitudeError': 0.020,
    'heightError': 0.031,
    'raw': '$GNGST,172814.0,0.006,0.023,0.020,273.6,0.023,0.020,0.031*74',
    'type': 'GST',
    'valid': true
  },
  // add hdt test
  '$HEHDT,066.2,T*2D': {
    'heading': 66.2,
    'raw': '$HEHDT,066.2,T*2D',
    'trueNorth': true,
    'type': 'HDT',
    'valid': true
  },
  '$GPGGA,023920.476,5230.942,N,01323.025,E,0,12,1.0,0.0,M,0.0,M,,*6E': {
    "age": null,
    "alt": 0,
    "geoidal": 0,
    "hdop": 1,
    "lat": 52.5157,
    "lon": 13.38375,
    "quality": null,
    "raw": "$GPGGA,023920.476,5230.942,N,01323.025,E,0,12,1.0,0.0,M,0.0,M,,*6E",
    "satellites": 12,
    "stationID": null,
    "time": new Date(today + 'T02:39:20.476Z'),
    "type": "GGA",
    "valid": false // false because we manually changed fix to 0
  },
  "$GPGSV,3,1,11,02,20,106,26,06,20,072,18,12,77,040,37,14,30,309,25,1*65": {
    "msgNumber": 1,
    "msgsTotal": 3,
    "raw": "$GPGSV,3,1,11,02,20,106,26,06,20,072,18,12,77,040,37,14,30,309,25,1*65",
    "satellites": [
      {
        "azimuth": 106,
        "elevation": 20,
        "key": "GP2",
        "prn": 2,
        "snr": 26,
        "status": "tracking",
        "system": "GPS"
      }, {
        "azimuth": 72,
        "elevation": 20,
        "key": "GP6",
        "prn": 6,
        "snr": 18,
        "status": "tracking",
        "system": "GPS"
      }, {
        "azimuth": 40,
        "elevation": 77,
        "key": "GP12",
        "prn": 12,
        "snr": 37,
        "status": "tracking",
        "system": "GPS"
      }, {
        "azimuth": 309,
        "elevation": 30,
        "key": "GP14",
        "prn": 14,
        "snr": 25,
        "status": "tracking",
        "system": "GPS"
      }
    ],
    "satsInView": 11,
    "signalId": 1,
    "system": "GPS",
    "type": "GSV",
    "valid": true
  },
  "$GAGSV,3,3,09,33,11,027,,7*4F": {
    "msgNumber": 3,
    "msgsTotal": 3,
    "raw": "$GAGSV,3,3,09,33,11,027,,7*4F",
    "satellites": [
      {
        "azimuth": 27,
        "elevation": 11,
        "key": "GA33",
        "prn": 33,
        "snr": null,
        "status": "in view",
        "system": "Galileo"
      }
    ],
    "satsInView": 9,
    "signalId": 7,
    "system": "Galileo",
    "type": "GSV",
    "valid": true
  },
  "$GPGSV,3,1,12,02,22,103,,03,00,357,,06,21,068,18,12,73,046,32,6*66": {
    "msgNumber": 1,
    "msgsTotal": 3,
    "raw": "$GPGSV,3,1,12,02,22,103,,03,00,357,,06,21,068,18,12,73,046,32,6*66",
    "satellites": [
      {
        "azimuth": 103,
        "elevation": 22,
        "key": "GP2",
        "prn": 2,
        "snr": null,
        "status": "in view",
        "system": "GPS"
      }, {
        "azimuth": 357,
        "elevation": 0,
        "key": "GP3",
        "prn": 3,
        "snr": null,
        "status": "in view",
        "system": "GPS"
      }, {
        "azimuth": 68,
        "elevation": 21,
        "key": "GP6",
        "prn": 6,
        "snr": 18,
        "status": "tracking",
        "system": "GPS"
      }, {
        "azimuth": 46,
        "elevation": 73,
        "key": "GP12",
        "prn": 12,
        "snr": 32,
        "status": "tracking",
        "system": "GPS"
      }
    ],
    "satsInView": 12,
    "signalId": 6,
    "system": "GPS",
    "type": "GSV",
    "valid": true
  },
  "$GAGSV,3,1,11,02,49,285,30,03,22,221,29,07,12,328,,08,32,278,35,7*74": {
    "msgNumber": 1,
    "msgsTotal": 3,
    "raw": "$GAGSV,3,1,11,02,49,285,30,03,22,221,29,07,12,328,,08,32,278,35,7*74",
    "satellites": [
      {
        "azimuth": 285,
        "elevation": 49,
        "key": "GA2",
        "prn": 2,
        "snr": 30,
        "status": "tracking",
        "system": "Galileo"
      }, {
        "azimuth": 221,
        "elevation": 22,
        "key": "GA3",
        "prn": 3,
        "snr": 29,
        "status": "tracking",
        "system": "Galileo"
      }, {
        "azimuth": 328,
        "elevation": 12,
        "key": "GA7",
        "prn": 7,
        "snr": null,
        "status": "in view",
        "system": "Galileo"
      }, {
        "azimuth": 278,
        "elevation": 32,
        "key": "GA8",
        "prn": 8,
        "snr": 35,
        "status": "tracking",
        "system": "Galileo"
      }
    ],
    "satsInView": 11,
    "signalId": 7,
    "type": "GSV",
    "system": "Galileo",
    "valid": true
  },
  "$GBGSV,1,1,04,13,31,064,,21,12,255,,26,18,293,27,29,46,155,31,1*78": {
    "msgNumber": 1,
    "msgsTotal": 1,
    "raw": "$GBGSV,1,1,04,13,31,064,,21,12,255,,26,18,293,27,29,46,155,31,1*78",
    "satellites": [
      {
        "azimuth": 64,
        "elevation": 31,
        "key": "GB13",
        "prn": 13,
        "snr": null,
        "status": "in view",
        "system": "BeiDou"
      }, {
        "azimuth": 255,
        "elevation": 12,
        "key": "GB21",
        "prn": 21,
        "snr": null,
        "status": "in view",
        "system": "BeiDou"
      }, {
        "azimuth": 293,
        "elevation": 18,
        "key": "GB26",
        "prn": 26,
        "snr": 27,
        "status": "tracking",
        "system": "BeiDou"
      }, {
        "azimuth": 155,
        "elevation": 46,
        "key": "GB29",
        "prn": 29,
        "snr": 31,
        "status": "tracking",
        "system": "BeiDou"
      }
    ],
    "satsInView": 4,
    "system": "BeiDou",
    "signalId": 1,
    "type": "GSV",
    "valid": true
  },
  "$GNRMC,191029.00,A,4843.01033,N,00227.78756,E,0.024,,010319,,,A,V*1C": {
    "faa": "autonomous",
    "lat": 48.716838833333334,
    "lon": 2.463126,
    "navStatus": "V",
    "raw": "$GNRMC,191029.00,A,4843.01033,N,00227.78756,E,0.024,,010319,,,A,V*1C",
    "speed": 0.044448,
    "status": "active",
    "time": new Date("2019-03-01T19:10:29.000Z"),
    "track": null,
    "type": "RMC",
    "valid": true,
    "variation": null
  },
  "$GNGSA,A,3,25,29,31,26,16,21,,,,,,,1.55,0.84,1.30,1*00": {
    "fix": "3D",
    "hdop": 0.84,
    "mode": "automatic",
    "system": "GPS",
    "systemId": 1,
    "pdop": 1.55,
    "raw": "$GNGSA,A,3,25,29,31,26,16,21,,,,,,,1.55,0.84,1.30,1*00",
    "satellites": [
      25,
      29,
      31,
      26,
      16,
      21
    ],
    "type": "GSA",
    "valid": true,
    "vdop": 1.3
  },
  '$GPRMC,085542.023,V,,,,,,,041211,,,N*45': {
    "faa": "not valid",
    "lat": null,
    "lon": null,
    "navStatus": null,
    "raw": "$GPRMC,085542.023,V,,,,,,,041211,,,N*45",
    "speed": null,
    "status": "void",
    "time": new Date('2011-12-04T08:55:42.023Z'),
    "track": null,
    "type": "RMC",
    "valid": true,
    "variation": null
  },
  '$GPGGA,100313.99,3344.459045,N,09639.616711,W,1,05,0.0,220.9,M,0.0,M,0.0,0000*66': {
    "age": 0,
    "alt": 220.9,
    "geoidal": 0,
    "hdop": 0,
    "lat": 33.74098408333333,
    "lon": -96.66027851666666,
    "quality": "fix",
    "raw": "$GPGGA,100313.99,3344.459045,N,09639.616711,W,1,05,0.0,220.9,M,0.0,M,0.0,0000*66",
    "satellites": 5,
    "stationID": 0,
    "time": new Date(today + 'T10:03:13.990Z'),
    "type": "GGA",
    "valid": true
  },
  '$GNGRS,112423.00,1,-0.1,-0.4,5.6,-4.3,1.4,-0.2,,,,,,,1,1*51': {
    "mode": 1,
    "raw": "$GNGRS,112423.00,1,-0.1,-0.4,5.6,-4.3,1.4,-0.2,,,,,,,1,1*51",
    "res": [
      -0.1,
      -0.4,
      5.6,
      -4.3,
      1.4,
      -0.2
    ],
    "time": new Date(today + 'T11:24:23.000Z'),
    "type": "GRS",
    "valid": true
  },
  '$GNGRS,112423.00,1,0.0,0.0,0.0,-6.4,-1.2,,,,,,,,1,6*7F': {
    "mode": 1,
    "raw": "$GNGRS,112423.00,1,0.0,0.0,0.0,-6.4,-1.2,,,,,,,,1,6*7F",
    "res": [
      0,
      0,
      0,
      -6.4,
      -1.2
    ],
    "time": new Date(today + 'T11:24:23.000Z'),
    "type": "GRS",
    "valid": true
  },
  '$GNGRS,112423.00,1,-2.5,0.8,0.2,7.2,6.2,,,,,,,,2,1*5B': {
    "mode": 1,
    "raw": "$GNGRS,112423.00,1,-2.5,0.8,0.2,7.2,6.2,,,,,,,,2,1*5B",
    "res": [
      -2.5,
      0.8,
      0.2,
      7.2,
      6.2
    ],
    "time": new Date(today + 'T11:24:23.000Z'),
    "type": "GRS",
    "valid": true
  },
  '$GNGBS,112424.00,2.5,1.5,5.4,,,,,,*5D': {
    "raw": "$GNGBS,112424.00,2.5,1.5,5.4,,,,,,*5D",
    "type": "GBS",
    "time": new Date(today + 'T11:24:24.000Z'),
    "errLat": 2.5,
    "errLon": 1.5,
    "errAlt": 5.4,
    "failedSat": null,
    "probFailedSat": null,
    "biasFailedSat": null,
    "stdFailedSat": null,
    "valid": true,
    "systemId": null,
    "signalId": null
  },
  '$GPGBS,015509.00,-0.031,-0.186,0.219,19,0.000,-0.354,6.972*4D': {
    "raw": "$GPGBS,015509.00,-0.031,-0.186,0.219,19,0.000,-0.354,6.972*4D",
    "type": "GBS",
    "time": new Date(today + 'T01:55:09.000Z'),
    "errLat": -0.031,
    "errLon": -0.186,
    "errAlt": 0.219,
    "failedSat": 19,
    "probFailedSat": 0,
    "biasFailedSat": -0.354,
    "stdFailedSat": 6.972,
    "valid": true,
    "systemId": null,
    "signalId": null
  },
  '$GNGSA,A,3,24,12,19,15,,,,,,,,,5.27,3.57,3.87,1*05': {
    "fix": "3D",
    "hdop": 3.57,
    "mode": "automatic",
    "pdop": 5.27,
    "raw": "$GNGSA,A,3,24,12,19,15,,,,,,,,,5.27,3.57,3.87,1*05",
    "satellites": [
      24,
      12,
      19,
      15
    ],
    "systemId": 1,
    "system": "GPS",
    "type": "GSA",
    "valid": true,
    "vdop": 3.87
  },
  '$GNGNS,133216.00,4843.01093,N,00227.78866,E,ANNN,04,3.57,55.4,46.3,,,V*29': {
    "raw": "$GNGNS,133216.00,4843.01093,N,00227.78866,E,ANNN,04,3.57,55.4,46.3,,,V*29",
    "type": "GNS",
    "time": new Date(today + 'T13:32:16.000Z'),
    "valid": true,
    "alt": 55.4,
    "diffAge": null,
    "diffStation": null,
    "hdop": 3.57,
    "lat": 48.71684883333333,
    "lon": 2.463144333333333,
    "mode": "ANNN",
    "navStatus": "V",
    "satsUsed": 4,
    "sep": 46.3
  },
  '$GPGLL,5000.05254,N,04500.02356,E,090037.059,A*35': {
    'faa': null,
    "lat": 50.000875666666666,
    "lon": 45.00039266666667,
    "raw": "$GPGLL,5000.05254,N,04500.02356,E,090037.059,A*35",
    "status": "active",
    "type": "GLL",
    "valid": true,
    "time": new Date(today + 'T09:00:37.059Z'),
  },
  '$GPGGA,033016,1227.2470,S,13050.8514,E,2,6,0.9,11.8,M,,M*4A': {
    "age": 4,
    "alt": 11.8,
    "geoidal": null,
    "hdop": 0.9,
    "lat": -12.454116666666666,
    "lon": 130.84752333333333,
    "quality": "dgps-fix",
    "raw": "$GPGGA,033016,1227.2470,S,13050.8514,E,2,6,0.9,11.8,M,,M*4A",
    "satellites": 6,
    "stationID": null,
    "time": new Date(today + 'T03:30:16.000Z'),
    "type": "GGA",
    "valid": true
  },
  '$GPGGA,033631,1227.2473,S,13050.8504,E,2,6,0.9,7.4,M,,M*70': {
    "age": 70,
    "alt": 7.4,
    "geoidal": null,
    "hdop": 0.9,
    "lat": -12.454121666666667,
    "lon": 130.84750666666667,
    "quality": "dgps-fix",
    "raw": "$GPGGA,033631,1227.2473,S,13050.8504,E,2,6,0.9,7.4,M,,M*70",
    "satellites": 6,
    "stationID": null,
    "time": new Date(today + 'T03:36:31.000Z'),
    "type": "GGA",
    "valid": true
  },
  '$GPGGA,034030,1227.2475,S,13050.8528,E,2,6,0.9,8.1,M,,M*72': {
    "age": 72,
    "alt": 8.1,
    "geoidal": null,
    "hdop": 0.9,
    "lat": -12.454125,
    "lon": 130.84754666666666,
    "quality": "dgps-fix",
    "raw": "$GPGGA,034030,1227.2475,S,13050.8528,E,2,6,0.9,8.1,M,,M*72",
    "satellites": 6,
    "stationID": null,
    "time": new Date(today + 'T03:40:30.000Z'),
    "type": "GGA",
    "valid": true
  },
  '$BDGSV,4,1,16,01,,,37,02,,,38,03,,,39,05,,,37,0,4*6A': {
    "msgNumber": 1,
    "msgsTotal": 4,
    "raw": "$BDGSV,4,1,16,01,,,37,02,,,38,03,,,39,05,,,37,0,4*6A",
    "satellites": [{
      "azimuth": null,
      "elevation": null,
      "key": "BD1",
      "prn": 1,
      "snr": 37,
      "status": "tracking",
      "system": "BD"
    }, {
      "azimuth": null,
      "elevation": null,
      "key": "BD2",
      "prn": 2,
      "snr": 38,
      "status": "tracking",
      "system": "BD"
    }, {
      "azimuth": null,
      "elevation": null,
      "key": "BD3",
      "prn": 3,
      "snr": 39,
      "status": "tracking",
      "system": "BD"
    }, {
      "azimuth": null,
      "elevation": null,
      "key": "BD5",
      "prn": 5,
      "snr": 37,
      "status": "tracking",
      "system": "BD"
    }],
    "satsInView": 16,
    "system": "BD",
    "signalId": null,
    "type": "GSV",
    "valid": true
  },
  '$BDGSV,1,1,03,10,46,329,31,08,43,161,,09,40,217,*52': {
    "msgNumber": 1,
    "msgsTotal": 1,
    "raw": "$BDGSV,1,1,03,10,46,329,31,08,43,161,,09,40,217,*52",
    "satellites": [{
      "azimuth": 329,
      "elevation": 46,
      "key": "BD10",
      "prn": 10,
      "snr": 31,
      "status": "tracking",
      "system": "BD"
    }, {
      "azimuth": 161,
      "elevation": 43,
      "key": "BD8",
      "prn": 8,
      "snr": null,
      "status": "in view",
      "system": "BD"
    }, {
      "azimuth": 217,
      "elevation": 40,
      "key": "BD9",
      "prn": 9,
      "snr": null,
      "status": "in view",
      "system": "BD"
    }],
    "satsInView": 3,
    "signalId": null,
    "system": "BD",
    "type": "GSV",
    "valid": true
  },
  '$BDGSV,2,1,06,211,18,305,36,205,07,113,,206,04,029,,209,30,046,*67': {
    "msgNumber": 1,
    "msgsTotal": 2,
    "raw": "$BDGSV,2,1,06,211,18,305,36,205,07,113,,206,04,029,,209,30,046,*67",
    "satellites": [{
      "azimuth": 305,
      "elevation": 18,
      "key": "BD211",
      "prn": 211,
      "snr": 36,
      "status": "tracking",
      "system": "BD"
    }, {
      "azimuth": 113,
      "elevation": 7,
      "key": "BD205",
      "prn": 205,
      "snr": null,
      "status": "in view",
      "system": "BD"
    }, {
      "azimuth": 29,
      "elevation": 4,
      "key": "BD206",
      "prn": 206,
      "snr": null,
      "status": "in view",
      "system": "BD"
    }, {
      "azimuth": 46,
      "elevation": 30,
      "key": "BD209",
      "prn": 209,
      "snr": null,
      "status": "in view",
      "system": "BD"
    }],
    "satsInView": 6,
    "system": "BD",
    "signalId": null,
    "type": "GSV",
    "valid": true
  },
  '$GNTXT,01,01,02,PF=3FF*4B':{
    "completed": true,
    "message": "PF=3FF",
    "raw": "$GNTXT,01,01,02,PF=3FF*4B",
    "rawMessages": [
      "PF=3FF",
    ],
    "sentenceAmount": 1,
    "type": "TXT",
    "valid": true
  },
  '$GNTXT,01,01,02,ANTSTATUS=OK*25':{
    "completed": true,
    "message": "ANTSTATUS=OK",
    "raw": "$GNTXT,01,01,02,ANTSTATUS=OK*25",
    "rawMessages": [
      "ANTSTATUS=OK",
    ],
    "sentenceAmount": 1,
    "type": "TXT",
    "valid": true
  },
  '$GNTXT,01,01,02,LLC=FFFFFFFF-FFFFFFFF-FFFFFFFF-FFFFFFFF-FFFFFFFD*2F':{
    "completed": true,
    "message": "LLC=FFFFFFFF-FFFFFFFF-FFFFFFFF-FFFFFFFF-FFFFFFFD",
    "raw": "$GNTXT,01,01,02,LLC=FFFFFFFF-FFFFFFFF-FFFFFFFF-FFFFFFFF-FFFFFFFD*2F",
    "rawMessages": [
      "LLC=FFFFFFFF-FFFFFFFF-FFFFFFFF-FFFFFFFF-FFFFFFFD",
    ],
    "sentenceAmount": 1,
    "type": "TXT",
    "valid": true
  },
  '$GNTXT,01,01,02,some escape chars: ^21*2F':{
    "completed": true,
    "message": "some escape chars: !",
    "raw": "$GNTXT,01,01,02,some escape chars: ^21*2F",
    "rawMessages": [
      "some escape chars: !",
    ],
    "sentenceAmount": 1,
    "type": "TXT",
    "valid": false
  },
  '$GNTXT,02,01,02,a multipart message^2C this is part 1^0D^0A*34':{
    "completed": false,
    "message": null,
    "raw": "$GNTXT,02,01,02,a multipart message^2C this is part 1^0D^0A*34",
    "rawMessages": [],
    "sentenceAmount": 2,
    "type": "TXT",
    "valid": true
  },
  '$GNTXT,02,02,02,a multipart message^2C this is part 2^0D^0A*34':{
    "completed": true,
    "message": "a multipart message, this is part 1\r\na multipart message, this is part 2\r\n",
    "raw": "$GNTXT,02,02,02,a multipart message^2C this is part 2^0D^0A*34",
    "rawMessages": [
      "a multipart message, this is part 1\r\n",
      "a multipart message, this is part 2\r\n",
    ],
    "sentenceAmount": 2,
    "type": "TXT",
    "valid": true
  }
};
var collect = {};
gps.on('data', function (data) {

  collect[data.raw] = data;
});
for (var i in tests) {

  if (!gps.update(i)) {
    collect[i] = 'invalid';
  }
}

describe('NMEA syntax', function () {

  for (var i in collect) {

    (function (i) {

      it('Should pass ' + i, function () {
        assert.deepEqual(collect[i], tests[i]);
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
 '$GPGGA,085543.023,,,,,0,00,,,M,0.0,M,,0000*58',
 '$IIBWC,160947,6008.160,N,02454.290,E,162.4,T,154.3,M,001.050,N,DEST*1C',
 '$IIAPB,A,A,0.001,L,N,V,V,154.3,M,DEST,154.3,M,154.2,M*19'
 $GPGGA,092750.000,5321.6802,N,00630.3372,W,1,8,1.03,61.7,M,55.2,M,,*76
 $GPGGA,181650.692,7204.589,N,01915.106,W,0,00,,,M,,M,,*59
 $GPGGA,092751.000,5321.6802,N,00630.3371,W,1,8,1.03,61.7,M,55.3,M,,*75
 $GPGGA,181514.692,4951.923,S,03050.357,W,0,00,,,M,,M,,*4F
 */
