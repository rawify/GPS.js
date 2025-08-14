'use strict';

const D2R = Math.PI / 180;

function parseTime(time, date = null) {
  // Accepts hhmmss(.sss)? and optional ddmmyy or ddmmyyyy (ZDA/GPRMC variants).
  if (!time) return null;

  const ret = new Date();

  if (date) {
    const year = date.slice(4);
    const month = date.slice(2, 4) - 1;
    const day = date.slice(0, 2);

    if (year.length === 4) {
      ret.setUTCFullYear(+year, +month, +day);
    } else {
      // If we need to parse older GPRMC data, we should hack something like
      // year < 73 ? 2000+year : 1900+year
      // Since GPS appeared in 1973
      ret.setUTCFullYear(Number('20' + year), +month, +day);
    }
  }

  ret.setUTCHours(+time.slice(0, 2));
  ret.setUTCMinutes(+time.slice(2, 4));
  ret.setUTCSeconds(+time.slice(4, 6));

  // Milliseconds: allow no decimals, .ss, .sss, .ssss... and normalize to ms
  const dot = time.indexOf('.');
  let ms = 0;
  if (dot !== -1 && dot + 1 < time.length) {
    const frac = time.slice(dot + 1);
    // Take up to 3 digits; if fewer, scale; if more, truncate
    if (frac.length >= 3) {
      ms = +frac.slice(0, 3);
    } else if (frac.length === 2) {
      ms = +frac * 10; // .xx => xx0 ms
    } else if (frac.length === 1) {
      ms = +frac * 100; // .x => x00 ms
    }
  }
  ret.setUTCMilliseconds(ms);
  return ret;
}

function parseCoord(coord, dir) {
  // NMEA lat: DDMM.mmmm; lon: DDDMM.mmmm; dir in {N,S,E,W}
  // Latitude can go from 0 to 90; longitude can go from -180 to 180.
  if (coord === '') return null;

  let n, sgn = 1;
  switch (dir) {
    case 'S': sgn = -1;
    case 'N': n = 2; break;
    case 'W': sgn = -1;
    case 'E': n = 3; break;
    default: return null; // Unknown direction
  }
  return sgn * (parseFloat(coord.slice(0, n)) + parseFloat(coord.slice(n)) / 60);
}

function parseNumber(num) {
  return num === '' ? null : parseFloat(num);
}

function parseKnots(knots) {
  return knots === '' ? null : parseFloat(knots) * 1.852; // km/h
}

function parseSystemId(systemId) {
  switch (systemId) {
    case 0: return 'QZSS';
    case 1: return 'GPS';
    case 2: return 'GLONASS';
    case 3: return 'Galileo';
    case 4: return 'BeiDou';
    default: return 'unknown';
  }
}

function parseSystem(str) {
  const satellite = str.slice(1, 3);
  switch (satellite) {
    case 'GP': return 'GPS';
    case 'GQ': return 'QZSS';
    case 'GL': return 'GLONASS';
    case 'GA': return 'Galileo';
    case 'GB': return 'BeiDou';
    default: return satellite;
  }
}

function parseGSAMode(mode) {
  switch (mode) {
    case 'M': return 'manual';
    case 'A': return 'automatic';
    case '': return null;
  }
  throw new Error('INVALID GSA MODE: ' + mode);
}

function parseGGAFix(fix) {
  if (fix === '') return null;
  switch (parseInt(fix, 10)) {
    case 0: return null;
    case 1: return 'fix';         // valid SPS fix
    case 2: return 'dgps-fix';    // valid DGPS fix
    case 3: return 'pps-fix';     // valid PPS fix
    case 4: return 'rtk';         // RTK fixed
    case 5: return 'rtk-float';   // RTK float
    case 6: return 'estimated';   // dead reckoning
    case 7: return 'manual';
    case 8: return 'simulated';
  }
  throw new Error('INVALID GGA FIX: ' + fix);
}

function parseGSAFix(fix) {
  if (fix === '') return null;
  switch (parseInt(fix, 10)) {
    case 1: return null;
    case 2: return '2D';
    case 3: return '3D';
  }
  throw new Error('INVALID GSA FIX: ' + fix);
}

function parseRMC_GLLStatus(status) {
  switch (status) {
    case '': return null;
    case 'A': return 'active';
    case 'V': return 'void';
  }
  throw new Error('INVALID RMC/GLL STATUS: ' + status);
}

function parseFAA(faa) {
  // Only A and D will correspond to an Active and reliable sentence
  switch (faa) {
    case '': return null;
    case 'A': return 'autonomous';
    case 'D': return 'differential';
    case 'E': return 'estimated';    // dead reckoning
    case 'M': return 'manual input';
    case 'S': return 'simulated';
    case 'N': return 'not valid';
    case 'P': return 'precise';
    case 'R': return 'rtk';
    case 'F': return 'rtk-float';
  }
  throw new Error('INVALID FAA MODE: ' + faa);
}

function parseRMCVariation(vari, dir) {
  if (vari === '' || dir === '') return null;
  return parseFloat(vari) * (dir === 'W' ? -1 : 1);
}

function parseDist(num, unit) {
  if (unit === 'M' || unit === '') return parseNumber(num);
  throw new Error('Unknown unit: ' + unit);
}

/**
 *
 * @constructor
 */
function GPS() {
  if (!(this instanceof GPS)) return new GPS();

  // Public fields
  this['events'] = Object.create(null);
  this['state'] = { 'errors': 0, 'processed': 0 };

  // Internal, per-instance collectors (avoid cross-stream state bleed)
  this['_collectSats'] = Object.create(null);
  this['_collectActiveSats'] = Object.create(null);
  this['_lastSeenSat'] = Object.create(null);

  // Streaming buffer
  this['partial'] = '';
}

/* Static fields (explicit for speed and minification) */
GPS['mod'] = {
  // Global Positioning System Fix Data
  'GGA': function (str, gga) {
    if (gga.length !== 16 && gga.length !== 14) {
      throw new Error('Invalid GGA length: ' + str);
    }

    /*
     11
     1         2       3 4        5 6 7  8   9  10 |  12 13  14  15
     |         |       | |        | | |  |   |   | |   | |   |   |
     $--GGA,hhmmss.ss,llll.ll,a,yyyyy.yy,a,x,xx,x.x,x.x,M,x.x,M,x.x,xxxx*hh
     
     1) Time (UTC)
     2) Latitude
     3) N or S (North or South)
     4) Longitude
     5) E or W (East or West)
     6) GPS Quality Indicator,
     0 = Invalid, 1 = Valid SPS, 2 = Valid DGPS, 3 = Valid PPS
     7) Number of satellites in view, 00 - 12
     8) Horizontal Dilution of precision, lower is better
     9) Antenna Altitude above/below mean-sea-level (geoid)
     10) Units of antenna altitude, meters
     11) Geoidal separation, the difference between the WGS-84 earth
     ellipsoid and mean-sea-level (geoid), '-' means mean-sea-level below ellipsoid
     12) Units of geoidal separation, meters
     13) Age of differential GPS data, time in seconds since last SC104
     type 1 or 9 update, null field when DGPS is not used
     14) Differential reference station ID, 0000-1023
     15) Checksum
     */

    return {
      'time': parseTime(gga[1]),
      'lat': parseCoord(gga[2], gga[3]),
      'lon': parseCoord(gga[4], gga[5]),
      'alt': parseDist(gga[9], gga[10]),
      'quality': parseGGAFix(gga[6]),
      'satellites': parseNumber(gga[7]),
      'hdop': parseNumber(gga[8]), // dilution
      'geoidal': parseDist(gga[11], gga[12]), // above geoid
      'age': gga[13] === undefined ? null : parseNumber(gga[13]),   // DGPS age
      'stationID': gga[14] === undefined ? null : parseNumber(gga[14])    // DGPS ref
    };
  },

  // GPS DOP and active satellites
  'GSA': function (str, gsa) {

    if (gsa.length !== 19 && gsa.length !== 20) {
      throw new Error('Invalid GSA length: ' + str);
    }

    /*
     eg1. $GPGSA,A,3,,,,,,16,18,,22,24,,,3.6,2.1,2.2*3C
     eg2. $GPGSA,A,3,19,28,14,18,27,22,31,39,,,,,1.7,1.0,1.3*35
     
     
     1    = Mode:
     M=Manual, forced to operate in 2D or 3D
     A=Automatic, 3D/2D
     2    = Mode:
     1=Fix not available
     2=2D
     3=3D
     3-14 = PRNs of Satellite Vehicles (SVs) used in position fix (null for unused fields)
     15   = PDOP
     16   = HDOP
     17   = VDOP
     (18) = systemID NMEA 4.10
     18   = Checksum
     */

    const sats = [];
    for (let i = 3; i < 15; i++) {
      if (gsa[i] !== '') sats.push(parseInt(gsa[i], 10));
    }
    const sid = gsa.length > 19 ? parseNumber(gsa[18]) : null;
    return {
      'mode': parseGSAMode(gsa[1]),
      'fix': parseGSAFix(gsa[2]),
      'satellites': sats,
      'pdop': parseNumber(gsa[15]),
      'hdop': parseNumber(gsa[16]),
      'vdop': parseNumber(gsa[17]),
      'systemId': sid,
      'system': sid !== null ? parseSystemId(sid) : 'unknown'
    };
  },

  // Recommended Minimum data for GPS
  'RMC': function (str, rmc) {
    if (rmc.length !== 13 && rmc.length !== 14 && rmc.length !== 15) {
      throw new Error('Invalid RMC length: ' + str);
    }

    /*
     $GPRMC,hhmmss.ss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,ddmmyy,x.x,a*hh
     
     RMC  = Recommended Minimum Specific GPS/TRANSIT Data
     1    = UTC of position fix
     2    = Data status (A-ok, V-invalid)
     3    = Latitude of fix
     4    = N or S
     5    = Longitude of fix
     6    = E or W
     7    = Speed over ground in knots
     8    = Track made good in degrees True
     9    = UT date
     10   = Magnetic variation degrees (Easterly var. subtracts from true course)
     11   = E or W
     (12) = NMEA 2.3 introduced FAA mode indicator (A=Autonomous, D=Differential, E=Estimated, N=Data not valid)
     (13) = NMEA 4.10 introduced nav status
     12   = Checksum
     */

    return {
      'time': parseTime(rmc[1], rmc[9]),
      'status': parseRMC_GLLStatus(rmc[2]),
      'lat': parseCoord(rmc[3], rmc[4]),
      'lon': parseCoord(rmc[5], rmc[6]),
      'speed': parseKnots(rmc[7]),
      'track': parseNumber(rmc[8]), // heading (true)
      'variation': parseRMCVariation(rmc[10], rmc[11]),
      'faa': rmc.length > 13 ? parseFAA(rmc[12]) : null,
      'navStatus': rmc.length > 14 ? rmc[13] : null
    };
  },

  // Track info
  'VTG': function (str, vtg) {
    if (vtg.length !== 10 && vtg.length !== 11) {
      throw new Error('Invalid VTG length: ' + str);
    }

    /*
     ------------------------------------------------------------------------------
     1  2  3  4  5  6  7  8 9   10
     |  |  |  |  |  |  |  | |   |
     $--VTG,x.x,T,x.x,M,x.x,N,x.x,K,m,*hh<CR><LF>
     ------------------------------------------------------------------------------
     
     1    = Track made good (degrees true)
     2    = Fixed text 'T' indicates that track made good is relative to true north
     3    = optional: Track made good (degrees magnetic)
     4    = optional: M: track made good is relative to magnetic north
     5    = Speed over ground in knots
     6    = Fixed text 'N' indicates that speed over ground in in knots
     7    = Speed over ground in kilometers/hour
     8    = Fixed text 'K' indicates that speed over ground is in kilometers/hour
     (9)   = FAA mode indicator (NMEA 2.3 and later)
     9/10 = Checksum
     */

    // Empty / all-null VTG (some receivers output this)
    if (vtg[2] === '' && vtg[8] === '' && vtg[6] === '') {
      return {
        'track': null,
        'trackMagnetic': null,
        'speed': null,
        'faa': null
      };
    }

    if (vtg[2] !== 'T') {
      throw new Error('Invalid VTG track mode: ' + str);
    }
    if (vtg[8] !== 'K' || vtg[6] !== 'N') {
      throw new Error('Invalid VTG speed tag: ' + str);
    }

    return {
      'track': parseNumber(vtg[1]),                           // true heading
      'trackMagnetic': vtg[3] === '' ? null : parseNumber(vtg[3]),    // magnetic
      'speed': parseKnots(vtg[5]),
      'faa': vtg.length === 11 ? parseFAA(vtg[9]) : null
    };
  },

  // Satellites in view
  'GSV': function (str, gsv) {
    // NMEA allows variable chunks of 4 fields per satellite + header/footer.
    // Keep legacy guard but allow most common valid shapes.
    if (gsv.length % 4 === 0) {
      // = 1 -> normal package
      // = 2 -> NMEA 4.10 extension
      // = 3 -> BeiDou extension?
      throw new Error('Invalid GSV length: ' + str);
    }

    /*
     $GPGSV,1,1,13,02,02,213,,03,-3,000,,11,00,121,,14,13,172,05*67
     
     1    = Total number of messages of this type in this cycle
     2    = Message number
     3    = Total number of SVs in view
     repeat [
     4    = SV PRN number
     5    = Elevation in degrees, 90 maximum
     6    = Azimuth, degrees from true north, 000 to 359
     7    = SNR (signal to noise ratio), 00-99 dB (null when not tracking, higher is better)
     ]
     N+1   = signalID NMEA 4.10
     N+2   = Checksum
     */

    const sats = [];
    const satellite = str.slice(1, 3);
    // fields: [totMsgs, msgNum, satsInView, (prn,elev,az,snr)*, (signalId)?, checksum]
    for (let i = 4; i < gsv.length - 3; i += 4) {
      const prn = parseNumber(gsv[i]);
      const snr = parseNumber(gsv[i + 3]);
      /*
       Plot satellites in Radar chart with north on top
       by linear map elevation from 0° to 90° into r to 0
       
       centerX + cos(azimuth - 90) * (1 - elevation / 90) * radius
       centerY + sin(azimuth - 90) * (1 - elevation / 90) * radius
       */
      sats.push({
        'prn': prn,
        'elevation': parseNumber(gsv[i + 1]),
        'azimuth': parseNumber(gsv[i + 2]),
        'snr': snr,
        'status': prn !== null ? (snr !== null ? 'tracking' : 'in view') : null,
        'system': parseSystem(str),
        'key': satellite + prn
      });
    }

    return {
      'msgNumber': parseNumber(gsv[2]),
      'msgsTotal': parseNumber(gsv[1]),
      'satsInView': parseNumber(gsv[3]),
      'satellites': sats,
      'signalId': gsv.length % 4 === 2 ? parseNumber(gsv[gsv.length - 2]) : null, // NMEA 4.10
      'system': parseSystem(str)
    };
  },

  // Geographic Position - Latitude/Longitude
  'GLL': function (str, gll) {
    if (gll.length !== 9 && gll.length !== 8) {
      throw new Error('Invalid GLL length: ' + str);
    }

    /*
     ------------------------------------------------------------------------------
     1       2 3        4 5         6 7   8
     |       | |        | |         | |   |
     $--GLL,llll.ll,a,yyyyy.yy,a,hhmmss.ss,a,m,*hh<CR><LF>
     ------------------------------------------------------------------------------
     
     1. Latitude
     2. N or S (North or South)
     3. Longitude
     4. E or W (East or West)
     5. Universal Time Coordinated (UTC)
     6. Status A - Data Valid, V - Data Invalid
     7. FAA mode indicator (NMEA 2.3 and later)
     8. Checksum
     */

    return {
      'time': parseTime(gll[5]),
      'status': parseRMC_GLLStatus(gll[6]),
      'lat': parseCoord(gll[1], gll[2]),
      'lon': parseCoord(gll[3], gll[4]),
      'faa': gll.length === 9 ? parseFAA(gll[7]) : null
    };
  },

  // UTC Date / Time and Local Time Zone Offset
  'ZDA': function (str, zda) {

    /*
     1    = hhmmss.ss = UTC
     2    = xx = Day, 01 to 31
     3    = xx = Month, 01 to 12
     4    = xxxx = Year
     5    = xx = Local zone description, 00 to +/- 13 hours
     6    = xx = Local zone minutes description (same sign as hours)
     */

    // TODO: incorporate local zone information

    // (No strict length guard; some receivers omit trailing fields)
    return {
      'time': parseTime(zda[1], zda[2] + zda[3] + zda[4])
      // 'delta': can be derived by consumer: (Date.now() - time)/1000
    };
  },

  'GST': function (str, gst) {
    if (gst.length !== 10) {
      throw new Error('Invalid GST length: ' + str);
    }

    /*
     1    = Time (UTC)
     2    = RMS value of the pseudorange residuals; includes carrier phase residuals during periods of RTK (float) and RTK (fixed) processing
     3    = Error ellipse semi-major axis 1 sigma error, in meters
     4    = Error ellipse semi-minor axis 1 sigma error, in meters
     5    = Error ellipse orientation, degrees from true north
     6    = Latitude 1 sigma error, in meters
     7    = Longitude 1 sigma error, in meters
     8    = Height 1 sigma error, in meters
     9    = Checksum
     */

    return {
      'time': parseTime(gst[1]),
      'rms': parseNumber(gst[2]),
      'ellipseMajor': parseNumber(gst[3]),
      'ellipseMinor': parseNumber(gst[4]),
      'ellipseOrientation': parseNumber(gst[5]),
      'latitudeError': parseNumber(gst[6]),
      'longitudeError': parseNumber(gst[7]),
      'heightError': parseNumber(gst[8])
    };
  },

  // Heading relative to True North
  'HDT': function (str, hdt) {
    if (hdt.length !== 4) {
      throw new Error('Invalid HDT length: ' + str);
    }

    /*
     ------------------------------------------------------------------------------
     1      2  3
     |      |  |
     $--HDT,hhh.hhh,T*XX<CR><LF>
     ------------------------------------------------------------------------------
     
     1. Heading in degrees
     2. T: indicates heading relative to True North
     3. Checksum
     */

    return {
      'heading': parseFloat(hdt[1]),
      'trueNorth': hdt[2] === 'T'
    };
  },

  'GRS': function (str, grs) {
    if (grs.length !== 18) {
      throw new Error('Invalid GRS length: ' + str);
    }
    const res = [];
    for (let i = 3; i <= 14; i++) {
      const tmp = parseNumber(grs[i]);
      if (tmp !== null) res.push(tmp);
    }
    return {
      'time': parseTime(grs[1]),
      'mode': parseNumber(grs[2]),
      'res': res
    };
  },

  'GBS': function (str, gbs) {
    if (gbs.length !== 10 && gbs.length !== 12) {
      throw new Error('Invalid GBS length: ' + str);
    }

    /*
     0      1   2   3   4   5   6   7   8
     |      |   |   |   |   |   |   |   |
     $--GBS,hhmmss.ss,x.x,x.x,x.x,x.x,x.x,x.x,x.x*hh<CR><LF>
     
     1. UTC time of the GGA or GNS fix associated with this sentence
     2. Expected error in latitude (meters)
     3. Expected error in longitude (meters)
     4. Expected error in altitude (meters)
     5. PRN (id) of most likely failed satellite
     6. Probability of missed detection for most likely failed satellite
     7. Estimate of bias in meters on most likely failed satellite
     8. Standard deviation of bias estimate
     --
     9. systemID (NMEA 4.10)
     10. signalID (NMEA 4.10)
     */

    return {
      'time': parseTime(gbs[1]),
      'errLat': parseNumber(gbs[2]),
      'errLon': parseNumber(gbs[3]),
      'errAlt': parseNumber(gbs[4]),
      'failedSat': parseNumber(gbs[5]),
      'probFailedSat': parseNumber(gbs[6]),
      'biasFailedSat': parseNumber(gbs[7]),
      'stdFailedSat': parseNumber(gbs[8]),
      'systemId': gbs.length === 12 ? parseNumber(gbs[9]) : null,
      'signalId': gbs.length === 12 ? parseNumber(gbs[10]) : null
    };
  },

  'GNS': function (str, gns) {
    if (gns.length !== 14 && gns.length !== 15) {
      throw new Error('Invalid GNS length: ' + str);
    }
    return {
      'time': parseTime(gns[1]),
      'lat': parseCoord(gns[2], gns[3]),
      'lon': parseCoord(gns[4], gns[5]),
      'mode': gns[6],
      'satsUsed': parseNumber(gns[7]),
      'hdop': parseNumber(gns[8]),
      'alt': parseNumber(gns[9]),
      'sep': parseNumber(gns[10]),
      'diffAge': parseNumber(gns[11]),
      'diffStation': parseNumber(gns[12]),
      'navStatus': gns.length === 15 ? gns[13] : null  // NMEA 4.10
    };
  }
};

/* Static parse + geodesy helpers */

GPS['Parse'] = function (line) {
  if (typeof line !== 'string' || line.length < 6) return false;
  if (line.charCodeAt(0) !== 36 /* '$' */) return false;

  const star = line.indexOf('*', 1);
  if (star === -1 || star + 2 >= line.length) return false;

  const nmea = [];
  const firstComma = line.indexOf(',', 1);
  if (firstComma === -1 || firstComma > star) return false;

  nmea.push('$' + line.slice(1, firstComma));

  // checksum over everything between '$' and '*'
  let checksum = 0;
  for (let i = 1; i < star; i++) checksum ^= line.charCodeAt(i);

  // split fields after the first comma
  let fieldStart = firstComma + 1;
  for (let i = fieldStart; i < star; i++) {
    if (line.charCodeAt(i) === 44 /* ',' */) {
      nmea.push(line.slice(fieldStart, i));
      fieldStart = i + 1;
    }
  }
  nmea.push(line.slice(fieldStart, star));

  const crcStr = line.slice(star + 1).trim();
  const crc = parseInt(crcStr.slice(0, 2), 16);
  if (!(crc >= 0 && crc <= 255)) return false;

  nmea[0] = nmea[0].slice(3);
  const type = nmea[0];
  const mod = GPS['mod'][type];
  if (mod === undefined) return false;

  nmea.push(crcStr.slice(0, 2));

  const data = mod(line, nmea);
  data['raw'] = line;
  data['valid'] = (checksum === crc);
  data['type'] = type;

  return data;
};

// Heading (N=0, E=90, S=180, W=270) from point 1 to point 2
GPS['Heading'] = function (lat1, lon1, lat2, lon2) {
  const dlon = (lon2 - lon1) * D2R;
  lat1 *= D2R; lat2 *= D2R;

  const sdlon = Math.sin(dlon), cdlon = Math.cos(dlon);
  const slat1 = Math.sin(lat1), clat1 = Math.cos(lat1);
  const slat2 = Math.sin(lat2), clat2 = Math.cos(lat2);

  const y = sdlon * clat2;
  const x = clat1 * slat2 - slat1 * clat2 * cdlon;

  const head = Math.atan2(y, x) * 180 / Math.PI;
  return (head + 360) % 360;
};

GPS['Distance'] = function (lat1, lon1, lat2, lon2) {
  // Haversine Formula
  // R.W. Sinnott, "Virtues of the Haversine", Sky and Telescope, vol. 68, no. 2, 1984, p. 159

  // Because Earth is no exact sphere, rounding errors may be up to 0.5%.
  // var RADIUS = 6371; // Earth radius average
  // var RADIUS = 6378.137; // Earth radius at equator
  const RADIUS = 6372.8; // km
  const hLat = (lat2 - lat1) * D2R * 0.5;
  const hLon = (lon2 - lon1) * D2R * 0.5;
  lat1 *= D2R; lat2 *= D2R;

  const shLat = Math.sin(hLat), shLon = Math.sin(hLon);
  const clat1 = Math.cos(lat1), clat2 = Math.cos(lat2);

  const tmp = shLat * shLat + clat1 * clat2 * shLon * shLon;
  //return RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  return RADIUS * 2 * Math.asin(Math.sqrt(tmp));
};

GPS['TotalDistance'] = function (path) {

  if (path.length < 2) return 0;
  let len = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const c = path[i];
    const n = path[i + 1];
    len += GPS['Distance'](c['lat'], c['lon'], n['lat'], n['lon']);
  }
  return len;
};

/* ---------- Instance methods (single prototype assignment) ---------- */

GPS.prototype = {
  constructor: GPS,

  /* Internal: merge parsed packet into state, keep short-term sat caches fresh */
  '_updateState': function (data) {
    const state = this['state'];

    // TODO: can we really use RMC time here or is it the time of fix?
    if (data['type'] === 'RMC' || data['type'] === 'GGA' || data['type'] === 'GLL' || data['type'] === 'GNS') {
      state['time'] = data['time'];
      state['lat'] = data['lat'];
      state['lon'] = data['lon'];
    }

    if (data['type'] === 'HDT') {
      state['heading'] = data['heading'];
      state['trueNorth'] = data['trueNorth'];
    }

    if (data['type'] === 'ZDA') {
      state['time'] = data['time'];
    }

    if (data['type'] === 'GGA') {
      state['alt'] = data['alt'];
    }

    if (data['type'] === 'RMC' /* || data['type'] === 'VTG' */) {
      // TODO: is rmc speed/track really interchangeable with vtg speed/track?
      state['speed'] = data['speed'];
      state['track'] = data['track'];
    }

    if (data['type'] === 'GSA') {
      const systemId = data['systemId'];
      if (systemId != null) this['_collectActiveSats'][systemId] = data['satellites'];

      const satsActive = [];
      const collectActiveSats = this['_collectActiveSats'];
      for (const s in collectActiveSats) {
        if (Object.prototype.hasOwnProperty.call(collectActiveSats, s)) {
          // Concatenate without allocating a new array for each system
          const arr = collectActiveSats[s];
          for (let i = 0, L = arr.length; i < L; i++) satsActive.push(arr[i]);
        }
      }

      state['satsActive'] = satsActive;
      state['fix'] = data['fix'];
      state['hdop'] = data['hdop'];
      state['pdop'] = data['pdop'];
      state['vdop'] = data['vdop'];
    }

    if (data['type'] === 'GSV') {
      const now = Date.now();
      const sats = data['satellites'];
      const collectSats = this['_collectSats'];
      const lastSeenSat = this['_lastSeenSat'];

      for (let i = 0, L = sats.length; i < L; i++) {
        const key = sats[i]['key'];
        lastSeenSat[key] = now;
        collectSats[key] = sats[i];
      }

      // Satellites are considered "visible" for 3 seconds after last seen
      const ret = [];
      for (const key in collectSats) {
        if (Object.prototype.hasOwnProperty.call(collectSats, key)) {
          if (now - lastSeenSat[key] < 3000) ret.push(collectSats[key]);
          else {
            // Optional: clean up stale entries
            delete collectSats[key];
            delete lastSeenSat[key];
          }
        }
      }
      state['satsVisible'] = ret;
    }
  },

  /**
   * Feed one full NMEA line (starting with '$', ending before CRLF).
   * Emits both 'data' and '<type>' events on success.
   */
  'update': function (line) {
    const parsed = GPS['Parse'](line);
    this['state']['processed']++;

    if (parsed === false) {
      this['state']['errors']++;
      return false;
    }

    this['_updateState'](parsed);

    this['emit']('data', parsed);
    this['emit'](parsed['type'], parsed);

    return true;
  },

  /**
   * Feed streaming data (chunks, possibly split arbitrarily).
   * Accepts either "\r\n" or "\n" as line delimiters.
   */
  'updatePartial': function (chunk) {
    if (chunk) this['partial'] += chunk;

    // Process all complete lines
    for (; ;) {
      const idxRN = this['partial'].indexOf('\r\n');
      const idxN = this['partial'].indexOf('\n');

      let pos = -1;
      if (idxRN !== -1) pos = idxRN;
      else if (idxN !== -1) pos = idxN;

      if (pos === -1) break;

      const line = this['partial'].slice(0, pos);
      // Advance buffer past delimiter (2 for CRLF, 1 for LF)
      this['partial'] = this['partial'].slice(pos + (idxRN === pos ? 2 : 1));

      if (line.charAt(0) !== '$') continue;

      try {
        this['update'](line);
      } catch (err) {
        // Keep buffer (don’t drop subsequent lines), but count the error
        this['state']['errors']++;
        // Re-throw for caller visibility
        throw err;
      }
    }
  },

  /**
   * Subscribe to an event. Multiple listeners per event are supported.
   * @param {string} ev
   * @param {function()} cb
   * @returns {GPS} this (chainable)
   */
  'on': function (ev, cb) {
    const cur = this['events'][ev];
    if (cur === undefined) {
      this['events'][ev] = [cb];
    } else if (typeof cur === 'function') {
      // Backward compatibility with previous single-listener design
      this['events'][ev] = [cur, cb];
    } else {
      this['events'][ev].push(cb);
    }
    return this;
  },

  /**
   * Remove listeners. If cb omitted, remove all for the event.
   * @param {string} ev
   * @param {function()} cb
   * @returns {GPS} this
   */
  'off': function (ev, cb) {
    const cur = this['events'][ev];
    if (cur === undefined) return this;

    if (!cb) {
      delete this['events'][ev];
      return this;
    }

    if (typeof cur === 'function') {
      if (cur === cb) delete this['events'][ev];
      return this;
    }

    // Array case
    for (let i = cur.length - 1; i >= 0; i--) {
      if (cur[i] === cb) cur.splice(i, 1);
    }
    if (cur.length === 0) delete this['events'][ev];
    return this;
  },

  /**
   * Emit an event to all listeners.
   * @param {string} ev
   * @param {*} data
   */
  'emit': function (ev, data) {
    const cur = this['events'][ev];
    if (cur === undefined) return;

    if (typeof cur === 'function') {
      cur.call(this, data);
      return;
    }
    // Array of listeners
    for (let i = 0, L = cur.length; i < L; i++) {
      cur[i].call(this, data);
    }
  }
};

Object.defineProperty(GPS, "__esModule", { 'value': true });
GPS['default'] = GPS;
GPS['GPS'] = GPS;
module['exports'] = GPS;
