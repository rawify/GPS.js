/**
 * @license GPS.js v0.9.0 9/9/2026
 * https://raw.org/software/libraries/gps-js/
 *
 * Copyright (c) 2026, Robert Eisele (https://raw.org/)
 * Licensed under the MIT license.
 **/

import type {
  FAAMode,
  GGAQuality,
  GPSState,
  LatLon,
  NavigationStatus,
  NMEA,
  NMEAByType,
  Satellite,
  TXT,
} from './types';

export type {
  FAAMode,
  GBS,
  GGA,
  GGAQuality,
  GLL,
  GNS,
  GRS,
  GSA,
  GST,
  GPSState,
  GSV,
  HDT,
  LatLon,
  NavigationStatus,
  NMEA,
  NMEAByType,
  RMC,
  Satellite,
  TXT,
  VTG,
  ZDA,
} from './types';

const D2R = Math.PI / 180;

interface TXTBuffer {
  total: number;
  parts: Array<string | null>;
  received: number;
  timer: ReturnType<typeof setTimeout> | null;
}

type SentencePayload<T extends NMEA> = T extends NMEA ? Omit<T, 'raw' | 'valid' | 'type'> : never;
type Parser<T extends NMEA = NMEA> = (sentence: string, fields: string[]) => SentencePayload<T>;
type ParserRegistry = { [Type in keyof NMEAByType]: Parser<NMEAByType[Type]> };
export type GPSListener<T extends NMEA = NMEA> = (data: T) => void;
type StoredGPSListener = GPSListener<NMEA>;
type InternalGPSState = GPSState & { txtBuffer: Record<string, TXTBuffer> };

function parseTime(time: string, date: string | null = null): Date | null {
  // Accepts hhmmss(.sss)? and optional ddmmyy or ddmmyyyy (ZDA/GPRMC variants).
  if (!time) return null;

  const result = new Date();

  if (date) {
    const year = date.slice(4);
    const month = +date.slice(2, 4) - 1;
    const day = date.slice(0, 2);

    if (year.length === 4) {
      result.setUTCFullYear(+year, +month, +day);
    } else {
      const shortYear = +year;
      result.setUTCFullYear(shortYear < 73 ? 2000 + shortYear : 1900 + shortYear, +month, +day);
    }
  }

  result.setUTCHours(+time.slice(0, 2));
  result.setUTCMinutes(+time.slice(2, 4));
  result.setUTCSeconds(+time.slice(4, 6));

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
  result.setUTCMilliseconds(ms);
  return result;
}

function parseCoord(coord: string, dir: string): number | null {
  // NMEA lat: DDMM.mmmm; lon: DDDMM.mmmm; dir in {N,S,E,W}
  // Latitude can go from 0 to 90; longitude can go from -180 to 180.
  if (coord === '') return null;
  const sgn = (dir === 'S' || dir === 'W') ? -1 : 1;
  const degreeDigits = (dir === 'N' || dir === 'S') ? 2 : 3;
  return sgn * (
    parseFloat(coord.slice(0, degreeDigits)) + parseFloat(coord.slice(degreeDigits)) / 60
  );
}

function parseNumber(num: string): number | null {
  return num.trim() === '' ? null : parseFloat(num);
}

function parseKnots(knots: string): number | null {
  return knots === '' ? null : parseFloat(knots) * 1.852; // km/h
}

function parseSystemId(systemId: number): string {
  switch (systemId) {
    case 1: return 'GPS';
    case 2: return 'GLONASS';
    case 3: return 'Galileo';
    case 4: return 'BeiDou';
    case 5: return 'QZSS';
    case 6: return 'NavIC';
    default: return 'unknown';
  }
}

function parseSystem(str: string): string {
  const satellite = str.slice(1, 3);
  switch (satellite) {
    case 'GP': return 'GPS';
    case 'GQ':
    case 'QZ': return 'QZSS';
    case 'GL': return 'GLONASS';
    case 'GA': return 'Galileo';
    case 'BD':
    case 'GB': return 'BeiDou';
    default: return satellite;
  }
}

function parseGSAMode(mode: string): 'manual' | 'automatic' | null {
  switch (mode) {
    case 'M': return 'manual';
    case 'A': return 'automatic';
    case '': return null;
  }
  throw new Error('INVALID GSA MODE: ' + mode);
}

function parseGGAFix(fix: string): GGAQuality | null {
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

function parseGSAFix(fix: string): '2D' | '3D' | null {
  if (fix === '') return null;
  switch (parseInt(fix, 10)) {
    case 1: return null;
    case 2: return '2D';
    case 3: return '3D';
  }
  throw new Error('INVALID GSA FIX: ' + fix);
}

function parseRMC_GLLStatus(status: string): 'active' | 'void' | null {
  switch (status) {
    case '': return null;
    case 'A': return 'active';
    case 'V': return 'void';
  }
  throw new Error('INVALID RMC/GLL STATUS: ' + status);
}

function parseNavigationStatus(status: string): NavigationStatus | null {
  switch (status) {
    case '': return null;
    case 'S': return 'safe';
    case 'C': return 'caution';
    case 'U': return 'unsafe';
    case 'V': return 'not valid';
  }
  throw new Error('INVALID NAVIGATION STATUS: ' + status);
}

function parseFAA(faa: string): FAAMode | null {
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

function parseRMCVariation(vari: string, dir: string): number | null {
  if (vari === '' || dir === '') return null;
  return parseFloat(vari) * (dir === 'W' ? -1 : 1);
}

function parseDist(num: string, unit: string): number | null {
  if (unit === 'M' || unit === '') return parseNumber(num);
  throw new Error('Unknown unit: ' + unit);
}

/**
 * Decode TXT caret-escapes and reject invalid chars.
 * Spec: NMEA0183-2 §5.1.3 (escapes) and §6.1 Table 1 (invalid chars)
 *
 * @param {string} str
 * @returns {string}
 */
function escapeString(str: string | null | undefined): string {
  if (str == null) return '';

  // Invalid characters per spec (excluding '^', which introduces escapes).
  const invalidCharacters = ['\r', '\n', '$', '*', ',', '!', '\\', '~', '\u007F'];
  for (const invalidCharacter of invalidCharacters) {
    if (str.includes(invalidCharacter)) {
      throw new Error(`Message may not contain invalid character '${invalidCharacter}'`);
    }
  }

  // Caret escapes: ^HH (hex byte) or ^^ (literal caret).
  let output = '';
  for (let index = 0; index < str.length; index++) {
    if (str[index] !== '^') {
      output += str[index];
      continue;
    }

    const first = str[index + 1];
    const second = str[index + 2];
    if (first === '^') {
      output += '^';
      index++;
      continue;
    }

    if (first && second && /^[\dA-Fa-f]{2}$/.test(first + second)) {
      output += String.fromCharCode(parseInt(first + second, 16));
      index += 2;
    } else {
      // Keep unknown escapes literally.
      output += '^';
    }
  }
  return output;
}

export class GPS {
  readonly events: Record<string, StoredGPSListener[]> = Object.create(null);
  readonly state: InternalGPSState = { errors: 0, processed: 0, txtBuffer: {} };
  private readonly satellites: Record<string, Satellite> = Object.create(null);
  private readonly activeSatellitesBySystem: Record<string, number[]> = Object.create(null);
  private readonly satelliteLastSeenAt: Record<string, number> = Object.create(null);
  private partialBuffer = '';

  static readonly parsers: ParserRegistry = {
    // Global Positioning System Fix Data
    GGA(str, gga) {
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
      time: parseTime(gga[1]),
      lat: parseCoord(gga[2], gga[3]),
      lon: parseCoord(gga[4], gga[5]),
      alt: parseDist(gga[9], gga[10]),
      quality: parseGGAFix(gga[6]),
      satellites: parseNumber(gga[7]),
      hdop: parseNumber(gga[8]), // dilution
      geoidal: parseDist(gga[11], gga[12]), // above geoid
      age: gga[13] === undefined ? null : parseNumber(gga[13]), // DGPS age
      stationID: gga[14] === undefined ? null : parseNumber(gga[14]) // DGPS ref
    };
  },

  // GPS DOP and active satellites
  GSA(str, gsa) {

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

    const sats: number[] = [];
    for (let fieldIndex = 3; fieldIndex < 15; fieldIndex++) {
      if (gsa[fieldIndex] !== '') sats.push(parseInt(gsa[fieldIndex], 10));
    }
    const sid = gsa.length > 19 ? parseNumber(gsa[18]) : null;
    return {
      mode: parseGSAMode(gsa[1]),
      fix: parseGSAFix(gsa[2]),
      satellites: sats,
      pdop: parseNumber(gsa[15]),
      hdop: parseNumber(gsa[16]),
      vdop: parseNumber(gsa[17]),
      systemId: sid,
      system: sid !== null ? parseSystemId(sid) : parseSystem(str)
    };
  },

  // Recommended Minimum data for GPS
  RMC(str, rmc) {
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
    10   = Magnetic variation degrees (easterly variation subtracts from true course)
     11   = E or W
     (12) = NMEA 2.3 introduced FAA mode indicator (A=Autonomous, D=Differential, E=Estimated, N=Data not valid)
     (13) = NMEA 4.10 introduced nav status
     12   = Checksum
     */

    return {
      time: parseTime(rmc[1], rmc[9]),
      status: parseRMC_GLLStatus(rmc[2]),
      lat: parseCoord(rmc[3], rmc[4]),
      lon: parseCoord(rmc[5], rmc[6]),
      speed: parseKnots(rmc[7]),
      track: parseNumber(rmc[8]), // heading (true)
      variation: parseRMCVariation(rmc[10], rmc[11]),
      faa: rmc.length > 13 ? parseFAA(rmc[12]) : null,
      navStatus: rmc.length > 14 ? parseNavigationStatus(rmc[13]) : null
    };
  },

  // Track info
  VTG(str, vtg) {
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
        track: null,
        trackMagnetic: null,
        speed: null,
        faa: null
      };
    }

    if (vtg[2] !== 'T') {
      throw new Error('Invalid VTG track mode: ' + str);
    }
    if (vtg[8] !== 'K' || vtg[6] !== 'N') {
      throw new Error('Invalid VTG speed tag: ' + str);
    }

    return {
      track: parseNumber(vtg[1]), // true heading
      trackMagnetic: vtg[3] === '' ? null : parseNumber(vtg[3]), // magnetic
      speed: parseKnots(vtg[5]),
      faa: vtg.length === 11 ? parseFAA(vtg[9]) : null
    };
  },

  // Satellites in view
  GSV(str, gsv) {
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

    const sats: Satellite[] = [];
    const satellite = str.slice(1, 3);
    // fields: [totMsgs, msgNum, satsInView, (prn,elev,az,snr)*, (signalId)?, checksum]
    for (let fieldIndex = 4; fieldIndex < gsv.length - 3; fieldIndex += 4) {
      const prn = parseNumber(gsv[fieldIndex]);
      const snr = parseNumber(gsv[fieldIndex + 3]);
      /*
       Plot satellites in Radar chart with north on top
       by linear map elevation from 0° to 90° into r to 0
       
       centerX + cos(azimuth - 90) * (1 - elevation / 90) * radius
       centerY + sin(azimuth - 90) * (1 - elevation / 90) * radius
       */
      sats.push({
        prn,
        elevation: parseNumber(gsv[fieldIndex + 1]),
        azimuth: parseNumber(gsv[fieldIndex + 2]),
        snr,
        status: prn !== null ? (snr !== null ? 'tracking' : 'in view') : null,
        system: parseSystem(str),
        key: satellite + prn
      });
    }

    return {
      msgNumber: parseNumber(gsv[2]),
      msgsTotal: parseNumber(gsv[1]),
      satsInView: parseNumber(gsv[3]),
      satellites: sats,
      signalId: gsv.length % 4 === 2 ? parseNumber(gsv[gsv.length - 2]) : null, // NMEA 4.10
      system: parseSystem(str)
    };
  },

  // Geographic Position - Latitude/Longitude
  GLL(str, gll) {
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
      time: parseTime(gll[5]),
      status: parseRMC_GLLStatus(gll[6]),
      lat: parseCoord(gll[1], gll[2]),
      lon: parseCoord(gll[3], gll[4]),
      faa: gll.length === 9 ? parseFAA(gll[7]) : null
    };
  },

  // UTC Date / Time and Local Time Zone Offset
  ZDA(str, zda) {

    /*
     1    = hhmmss.ss = UTC
     2    = xx = Day, 01 to 31
     3    = xx = Month, 01 to 12
     4    = xxxx = Year
     5    = xx = Local zone description, 00 to +/- 13 hours
     6    = xx = Local zone minutes description (same sign as hours)
     */

    // (No strict length guard; some receivers omit trailing fields)
    return {
      time: parseTime(zda[1], zda[2] + zda[3] + zda[4]),
      // 'delta': can be derived by consumer: (Date.now() - time)/1000
      offsetMin: (zda[5] === '' || zda[6] === '') ? null
        : (Math.sign(parseInt(zda[5], 10)) || 1) *
          (Math.abs(parseInt(zda[5], 10)) * 60 + parseInt(zda[6], 10))
    };
  },

  GST(str, gst) {
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
      time: parseTime(gst[1]),
      rms: parseNumber(gst[2]),
      ellipseMajor: parseNumber(gst[3]),
      ellipseMinor: parseNumber(gst[4]),
      ellipseOrientation: parseNumber(gst[5]),
      latitudeError: parseNumber(gst[6]),
      longitudeError: parseNumber(gst[7]),
      heightError: parseNumber(gst[8])
    };
  },

  // Heading relative to True North
  HDT(str, hdt) {
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
      heading: parseFloat(hdt[1]),
      trueNorth: hdt[2] === 'T'
    };
  },

  GRS(str, grs) {
    if (grs.length !== 18) {
      throw new Error('Invalid GRS length: ' + str);
    }
    const res = [];
    for (let fieldIndex = 3; fieldIndex <= 14; fieldIndex++) {
      const residual = parseNumber(grs[fieldIndex]);
      if (residual !== null) res.push(residual);
    }
    return {
      time: parseTime(grs[1]),
      mode: parseNumber(grs[2]),
      res
    };
  },

  GBS(str, gbs) {
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
      time: parseTime(gbs[1]),
      errLat: parseNumber(gbs[2]),
      errLon: parseNumber(gbs[3]),
      errAlt: parseNumber(gbs[4]),
      failedSat: parseNumber(gbs[5]),
      probFailedSat: parseNumber(gbs[6]),
      biasFailedSat: parseNumber(gbs[7]),
      stdFailedSat: parseNumber(gbs[8]),
      systemId: gbs.length === 12 ? parseNumber(gbs[9]) : null,
      signalId: gbs.length === 12 ? parseNumber(gbs[10]) : null
    };
  },

  GNS(str, gns) {
    if (gns.length !== 14 && gns.length !== 15) {
      throw new Error('Invalid GNS length: ' + str);
    }
    return {
      time: parseTime(gns[1]),
      lat: parseCoord(gns[2], gns[3]),
      lon: parseCoord(gns[4], gns[5]),
      mode: gns[6],
      satsUsed: parseNumber(gns[7]),
      hdop: parseNumber(gns[8]),
      alt: parseNumber(gns[9]),
      sep: parseNumber(gns[10]),
      diffAge: parseNumber(gns[11]),
      diffStation: parseNumber(gns[12]),
      navStatus: gns.length === 15 ? parseNavigationStatus(gns[13]) : null // NMEA 4.10
    };
  },

  // Text Transmission (TXT)
  // NMEA0183-2 §6.3  ($--TXT,xx,xx,xx,c...c*hh)
  TXT(str, txt) {

    // After talker removal, txt expected: ['TXT', total, index, id, payload, checksum]
    if (txt.length !== 6) {
      throw new Error('Invalid TXT length: ' + str);
    }

    const total = parseInt(txt[1], 10);
    const index = parseInt(txt[2], 10);
    const textId = parseInt(txt[3], 10);
    const rawPart = txt[4] || '';

    if (!(total >= 1 && total <= 99)) throw new Error('Invalid TXT total: ' + txt[1]);
    if (!(index >= 1 && index <= total)) throw new Error('Invalid TXT index: ' + txt[2]);
    if (!(textId >= 0 && textId <= 99)) throw new Error('Invalid TXT id: ' + txt[3]);
    if (rawPart.length > 61) throw new Error('Invalid TXT message length: ' + rawPart.length);

    const part = escapeString(rawPart);
    if (part === '') throw new Error('Invalid empty TXT message');

    // For single-part messages, we can return a completed object right away.
    // Multi-part completion is handled by assembleTXT().
    return {
      // assembly fields:
      total,
      index,
      id: textId,
      part, // decoded segment
      message: total === 1 ? part : null,
      completed: total === 1,
      rawMessages: total === 1 ? [part] : [],
      system: parseSystem(str) // e.g. 'GPS', 'GLONASS', ...
    };
    }
  };

  static Parse(line: string): false | NMEA {
    if (typeof line !== 'string' || line.length < 6 || line[0] !== '$') return false;

    const checksumSeparator = line.indexOf('*', 1);
    if (checksumSeparator === -1 || checksumSeparator + 2 >= line.length) return false;

    const firstComma = line.indexOf(',', 1);
    if (firstComma === -1 || firstComma > checksumSeparator) return false;

    const fields = [line.slice(0, firstComma)];

    // NMEA checksum: XOR every byte between '$' and '*'.
    let checksum = 0;
    for (let index = 1; index < checksumSeparator; index++) {
      checksum ^= line.charCodeAt(index);
    }

    let fieldStart = firstComma + 1;
    for (let index = fieldStart; index < checksumSeparator; index++) {
      if (line[index] === ',') {
        fields.push(line.slice(fieldStart, index));
        fieldStart = index + 1;
      }
    }
    fields.push(line.slice(fieldStart, checksumSeparator));

    const checksumText = line.slice(checksumSeparator + 1).trim();
    if (!/^[\dA-Fa-f]{2}$/.test(checksumText)) return false;
    const expectedChecksum = parseInt(checksumText, 16);

    const rawType = fields[0].slice(3);
    if (!(rawType in GPS.parsers)) return false;

    const type = rawType as keyof NMEAByType;
    fields[0] = type;
    fields.push(checksumText);

    const payload = GPS.parsers[type](line, fields);
    return {
      ...payload,
      raw: line,
      valid: checksum === expectedChecksum,
      type,
    } as NMEA;
  }

  // Heading (N=0, E=90, S=180, W=270) from point 1 to point 2
  static Heading(latFrom: number, lonFrom: number, latTo: number, lonTo: number): number {
    const longitudeDelta = (lonTo - lonFrom) * D2R;
    const latitudeFrom = latFrom * D2R;
    const latitudeTo = latTo * D2R;

    const eastComponent = Math.sin(longitudeDelta) * Math.cos(latitudeTo);
    const northComponent = Math.cos(latitudeFrom) * Math.sin(latitudeTo)
      - Math.sin(latitudeFrom) * Math.cos(latitudeTo) * Math.cos(longitudeDelta);

    const heading = Math.atan2(eastComponent, northComponent) / D2R;
    return (heading + 360) % 360;
  }

  static Distance(latFrom: number, lonFrom: number, latTo: number, lonTo: number): number {
    // Haversine formula. R.W. Sinnott, "Virtues of the Haversine",
    // Sky and Telescope, vol. 68, no. 2, 1984, p. 159.

    // Earth is not an exact sphere, so model error may be up to about 0.5%.
    const EARTH_RADIUS = 6372.8; // km
    const halfLatitudeDelta = (latTo - latFrom) * D2R * 0.5;
    const halfLongitudeDelta = (lonTo - lonFrom) * D2R * 0.5;
    const latitudeFrom = latFrom * D2R;
    const latitudeTo = latTo * D2R;

    const latitudeTerm = Math.sin(halfLatitudeDelta);
    const longitudeTerm = Math.sin(halfLongitudeDelta);
    const haversine = latitudeTerm * latitudeTerm
      + Math.cos(latitudeFrom) * Math.cos(latitudeTo) * longitudeTerm * longitudeTerm;

    return EARTH_RADIUS * 2 * Math.asin(Math.sqrt(haversine));
  }

  static TotalDistance(path: readonly LatLon[]): number {
  if (path.length < 2) return 0;

    let distance = 0;
    for (let index = 1; index < path.length; index++) {
      const previous = path[index - 1];
      const current = path[index];
      distance += GPS.Distance(previous.lat, previous.lon, current.lat, current.lon);
    }
    return distance;
  }

  /* Internal: merge parsed packet into state, keep short-term sat caches fresh */
  private updateState(data: NMEA): void {
    const state = this.state;

    // TODO: can we really use RMC time here or is it the time of fix?
    if (data.type === 'RMC' || data.type === 'GGA' || data.type === 'GLL' || data.type === 'GNS') {
      state.time = data.time;
      state.lat = data.lat;
      state.lon = data.lon;
    }

    if (data.type === 'HDT') {
      state.heading = data.heading;
      state.trueNorth = data.trueNorth;
    }

    if (data.type === 'ZDA') {
      state.time = data.time;
    }

    if (data.type === 'GGA') {
      state.alt = data.alt;
    }

    if (data.type === 'RMC' || data.type === 'VTG') {
      if (data.speed != null) state.speed = data.speed;
      if (data.track != null) state.track = data.track;
    }

    if (data.type === 'GSA') {
      const systemId = data.systemId;
      if (systemId != null) this.activeSatellitesBySystem[systemId] = data.satellites;

      const activeSatellites: number[] = [];
      for (const systemSatellites of Object.values(this.activeSatellitesBySystem)) {
        for (const satellite of systemSatellites) {
          activeSatellites.push(satellite);
        }
      }

      state.satsActive = activeSatellites;
      state.fix = data.fix;
      state.hdop = data.hdop;
      state.pdop = data.pdop;
      state.vdop = data.vdop;
    }

    if (data.type === 'GSV') {
      const now = Date.now();
      for (const satellite of data.satellites) {
        this.satelliteLastSeenAt[satellite.key] = now;
        this.satellites[satellite.key] = satellite;
      }

      // Satellites are considered "visible" for 3 seconds after last seen
      const visibleSatellites: Satellite[] = [];
      for (const [key, satellite] of Object.entries(this.satellites)) {
        if (now - this.satelliteLastSeenAt[key] < 3000) {
          visibleSatellites.push(satellite);
        } else {
          delete this.satellites[key];
          delete this.satelliteLastSeenAt[key];
        }
      }
      state.satsVisible = visibleSatellites;
    }
  }

  private assembleTXT(data: TXT): TXT {
    // Single-part already complete (parser set message)
    if (data.total === 1) return data;

    const key = `${data.system || ''}#${data.id}`;

    let buffer = this.state.txtBuffer[key];
    if (!buffer) {
      buffer = this.state.txtBuffer[key] = {
        total: data.total,
        parts: new Array(data.total).fill(null),
        received: 0,
        timer: null
      };
      // 10s timeout to avoid leaks
      const timer = setTimeout(() => {
        this.state.errors++;
        delete this.state.txtBuffer[key];
      }, 10000);
      (timer as unknown as { unref?: () => void }).unref?.();
      buffer.timer = timer;
    }

    // store part (index is 1-based)
    const partIndex = data.index - 1;
    if (0 <= partIndex && partIndex < buffer.total) {
      if (buffer.parts[partIndex] === null) {
        buffer.received++;
      }
      buffer.parts[partIndex] = data.part;
    }

    // check completion
    if (buffer.received === buffer.total) {
      if (buffer.timer !== null) clearTimeout(buffer.timer);
      delete this.state.txtBuffer[key];
      data.message = buffer.parts.join('');
      data.completed = true;
      data.rawMessages = buffer.parts as string[];

    } else {
      data.message = null;
      data.completed = false;
      data.rawMessages = [];
    }
    return data;
  }

  /**
   * Feed one full NMEA line (starting with '$', ending before CRLF).
   * Emits both 'data' and '<type>' events on success.
   */
  update(line: string): boolean {
    const parsed = GPS.Parse(line);
    this.state.processed++;

    if (parsed === false) {
      this.state.errors++;
      return false;
    }

    if (parsed.valid) {
      if (parsed.type === 'TXT') {
        this.assembleTXT(parsed);
      }
      this.updateState(parsed);
    } else {
      this.state.errors++;
    }

    this.emit('data', parsed);
    this.emit(parsed.type, parsed);

    return true;
  }

  /**
   * Feed streaming data (chunks, possibly split arbitrarily).
   * Accepts either "\r\n" or "\n" as line delimiters.
   */
  updatePartial(chunk: string): void {
    if (chunk) this.partialBuffer += chunk;

    // Process all complete lines
    while (true) {
      const newlineIndex = this.partialBuffer.indexOf('\n');
      if (newlineIndex === -1) break;

      let line = this.partialBuffer.slice(0, newlineIndex);
      this.partialBuffer = this.partialBuffer.slice(newlineIndex + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);

      if (!line.startsWith('$')) continue;

      try {
        this.update(line);
      } catch (err) {
        // Keep buffer (don’t drop subsequent lines), but count the error
        this.state.errors++;
        // Re-throw for caller visibility
        throw err;
      }
    }
  }

  /**
   * Subscribe to an event. Multiple listeners per event are supported.
   * @returns {GPS} this (chainable)
   */
  on(event: 'data', callback: GPSListener): this;
  on<T extends keyof NMEAByType>(event: T, callback: GPSListener<NMEAByType[T]>): this;
  on<T extends NMEA>(event: string, callback: GPSListener<T>): this {
    const listener = callback as unknown as StoredGPSListener;
    const listeners = this.events[event];
    if (listeners === undefined) {
      this.events[event] = [listener];
    } else {
      listeners.push(listener);
    }
    return this;
  }

  /**
   * Remove listeners. If cb omitted, remove all for the event.
   * @returns {GPS} this
   */
  off(event: 'data', callback?: GPSListener): this;
  off<T extends keyof NMEAByType>(event: T, callback?: GPSListener<NMEAByType[T]>): this;
  off<T extends NMEA>(event: string, callback?: GPSListener<T>): this {
    const listeners = this.events[event];
    if (listeners === undefined) return this;

    if (!callback) {
      delete this.events[event];
      return this;
    }

    const listener = callback as unknown as StoredGPSListener;
    for (let index = listeners.length - 1; index >= 0; index--) {
      if (listeners[index] === listener) listeners.splice(index, 1);
    }
    if (listeners.length === 0) delete this.events[event];
    return this;
  }

  /**
   * Emit an event to all listeners.
   */
  emit(event: string, data: NMEA): void {
    const listeners = this.events[event];
    if (listeners === undefined) return;

    for (const listener of listeners) {
      listener.call(this, data);
    }
  }
}

export default GPS;
