"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/gps.ts
var gps_exports = {};
__export(gps_exports, {
  GPS: () => GPS,
  default: () => gps_default
});
module.exports = __toCommonJS(gps_exports);
/**
 * @license GPS.js v0.9.0 9/9/2026
 * https://raw.org/software/libraries/gps-js/
 *
 * Copyright (c) 2026, Robert Eisele (https://raw.org/)
 * Licensed under the MIT license.
 **/
var D2R = Math.PI / 180;
function parseTime(time, date = null) {
  if (!time) return null;
  const result = /* @__PURE__ */ new Date();
  if (date) {
    const year = date.slice(4);
    const month = +date.slice(2, 4) - 1;
    const day = date.slice(0, 2);
    if (year.length === 4) {
      result.setUTCFullYear(+year, +month, +day);
    } else {
      const shortYear = +year;
      result.setUTCFullYear(shortYear < 73 ? 2e3 + shortYear : 1900 + shortYear, +month, +day);
    }
  }
  result.setUTCHours(+time.slice(0, 2));
  result.setUTCMinutes(+time.slice(2, 4));
  result.setUTCSeconds(+time.slice(4, 6));
  const dot = time.indexOf(".");
  let ms = 0;
  if (dot !== -1 && dot + 1 < time.length) {
    const frac = time.slice(dot + 1);
    if (frac.length >= 3) {
      ms = +frac.slice(0, 3);
    } else if (frac.length === 2) {
      ms = +frac * 10;
    } else if (frac.length === 1) {
      ms = +frac * 100;
    }
  }
  result.setUTCMilliseconds(ms);
  return result;
}
function parseCoord(coord, dir) {
  if (coord === "") return null;
  const sgn = dir === "S" || dir === "W" ? -1 : 1;
  const degreeDigits = dir === "N" || dir === "S" ? 2 : 3;
  return sgn * (parseFloat(coord.slice(0, degreeDigits)) + parseFloat(coord.slice(degreeDigits)) / 60);
}
function parseNumber(num) {
  return num.trim() === "" ? null : parseFloat(num);
}
function parseKnots(knots) {
  return knots === "" ? null : parseFloat(knots) * 1.852;
}
function parseSystemId(systemId) {
  switch (systemId) {
    case 1:
      return "GPS";
    case 2:
      return "GLONASS";
    case 3:
      return "Galileo";
    case 4:
      return "BeiDou";
    case 5:
      return "QZSS";
    case 6:
      return "NavIC";
    default:
      return "unknown";
  }
}
function parseSystem(str) {
  const satellite = str.slice(1, 3);
  switch (satellite) {
    case "GP":
      return "GPS";
    case "GQ":
    case "QZ":
      return "QZSS";
    case "GL":
      return "GLONASS";
    case "GA":
      return "Galileo";
    case "BD":
    case "GB":
      return "BeiDou";
    default:
      return satellite;
  }
}
function parseGSAMode(mode) {
  switch (mode) {
    case "M":
      return "manual";
    case "A":
      return "automatic";
    case "":
      return null;
  }
  throw new Error("INVALID GSA MODE: " + mode);
}
function parseGGAFix(fix) {
  if (fix === "") return null;
  switch (parseInt(fix, 10)) {
    case 0:
      return null;
    case 1:
      return "fix";
    // valid SPS fix
    case 2:
      return "dgps-fix";
    // valid DGPS fix
    case 3:
      return "pps-fix";
    // valid PPS fix
    case 4:
      return "rtk";
    // RTK fixed
    case 5:
      return "rtk-float";
    // RTK float
    case 6:
      return "estimated";
    // dead reckoning
    case 7:
      return "manual";
    case 8:
      return "simulated";
  }
  throw new Error("INVALID GGA FIX: " + fix);
}
function parseGSAFix(fix) {
  if (fix === "") return null;
  switch (parseInt(fix, 10)) {
    case 1:
      return null;
    case 2:
      return "2D";
    case 3:
      return "3D";
  }
  throw new Error("INVALID GSA FIX: " + fix);
}
function parseRMC_GLLStatus(status) {
  switch (status) {
    case "":
      return null;
    case "A":
      return "active";
    case "V":
      return "void";
  }
  throw new Error("INVALID RMC/GLL STATUS: " + status);
}
function parseNavigationStatus(status) {
  switch (status) {
    case "":
      return null;
    case "S":
      return "safe";
    case "C":
      return "caution";
    case "U":
      return "unsafe";
    case "V":
      return "not valid";
  }
  throw new Error("INVALID NAVIGATION STATUS: " + status);
}
function parseFAA(faa) {
  switch (faa) {
    case "":
      return null;
    case "A":
      return "autonomous";
    case "D":
      return "differential";
    case "E":
      return "estimated";
    // dead reckoning
    case "M":
      return "manual input";
    case "S":
      return "simulated";
    case "N":
      return "not valid";
    case "P":
      return "precise";
    case "R":
      return "rtk";
    case "F":
      return "rtk-float";
  }
  throw new Error("INVALID FAA MODE: " + faa);
}
function parseRMCVariation(vari, dir) {
  if (vari === "" || dir === "") return null;
  return parseFloat(vari) * (dir === "W" ? -1 : 1);
}
function parseDist(num, unit) {
  if (unit === "M" || unit === "") return parseNumber(num);
  throw new Error("Unknown unit: " + unit);
}
function escapeString(str) {
  if (str == null) return "";
  const invalidCharacters = ["\r", "\n", "$", "*", ",", "!", "\\", "~", "\x7F"];
  for (const invalidCharacter of invalidCharacters) {
    if (str.includes(invalidCharacter)) {
      throw new Error(`Message may not contain invalid character '${invalidCharacter}'`);
    }
  }
  let output = "";
  for (let index = 0; index < str.length; index++) {
    if (str[index] !== "^") {
      output += str[index];
      continue;
    }
    const first = str[index + 1];
    const second = str[index + 2];
    if (first === "^") {
      output += "^";
      index++;
      continue;
    }
    if (first && second && /^[\dA-Fa-f]{2}$/.test(first + second)) {
      output += String.fromCharCode(parseInt(first + second, 16));
      index += 2;
    } else {
      output += "^";
    }
  }
  return output;
}
var _GPS = class _GPS {
  constructor() {
    this.events = /* @__PURE__ */ Object.create(null);
    this.state = { errors: 0, processed: 0, txtBuffer: {} };
    this.satellites = /* @__PURE__ */ Object.create(null);
    this.activeSatellitesBySystem = /* @__PURE__ */ Object.create(null);
    this.satelliteLastSeenAt = /* @__PURE__ */ Object.create(null);
    this.partialBuffer = "";
  }
  static Parse(line) {
    if (typeof line !== "string" || line.length < 6 || line[0] !== "$") return false;
    const checksumSeparator = line.indexOf("*", 1);
    if (checksumSeparator === -1 || checksumSeparator + 2 >= line.length) return false;
    const firstComma = line.indexOf(",", 1);
    if (firstComma === -1 || firstComma > checksumSeparator) return false;
    const fields = [line.slice(0, firstComma)];
    let checksum = 0;
    for (let index = 1; index < checksumSeparator; index++) {
      checksum ^= line.charCodeAt(index);
    }
    let fieldStart = firstComma + 1;
    for (let index = fieldStart; index < checksumSeparator; index++) {
      if (line[index] === ",") {
        fields.push(line.slice(fieldStart, index));
        fieldStart = index + 1;
      }
    }
    fields.push(line.slice(fieldStart, checksumSeparator));
    const checksumText = line.slice(checksumSeparator + 1).trim();
    if (!/^[\dA-Fa-f]{2}$/.test(checksumText)) return false;
    const expectedChecksum = parseInt(checksumText, 16);
    const rawType = fields[0].slice(3);
    if (!(rawType in _GPS.parsers)) return false;
    const type = rawType;
    fields[0] = type;
    fields.push(checksumText);
    const payload = _GPS.parsers[type](line, fields);
    return {
      ...payload,
      raw: line,
      valid: checksum === expectedChecksum,
      type
    };
  }
  // Heading (N=0, E=90, S=180, W=270) from point 1 to point 2
  static Heading(latFrom, lonFrom, latTo, lonTo) {
    const longitudeDelta = (lonTo - lonFrom) * D2R;
    const latitudeFrom = latFrom * D2R;
    const latitudeTo = latTo * D2R;
    const eastComponent = Math.sin(longitudeDelta) * Math.cos(latitudeTo);
    const northComponent = Math.cos(latitudeFrom) * Math.sin(latitudeTo) - Math.sin(latitudeFrom) * Math.cos(latitudeTo) * Math.cos(longitudeDelta);
    const heading = Math.atan2(eastComponent, northComponent) / D2R;
    return (heading + 360) % 360;
  }
  static Distance(latFrom, lonFrom, latTo, lonTo) {
    const EARTH_RADIUS = 6372.8;
    const halfLatitudeDelta = (latTo - latFrom) * D2R * 0.5;
    const halfLongitudeDelta = (lonTo - lonFrom) * D2R * 0.5;
    const latitudeFrom = latFrom * D2R;
    const latitudeTo = latTo * D2R;
    const latitudeTerm = Math.sin(halfLatitudeDelta);
    const longitudeTerm = Math.sin(halfLongitudeDelta);
    const haversine = latitudeTerm * latitudeTerm + Math.cos(latitudeFrom) * Math.cos(latitudeTo) * longitudeTerm * longitudeTerm;
    return EARTH_RADIUS * 2 * Math.asin(Math.sqrt(haversine));
  }
  static TotalDistance(path) {
    if (path.length < 2) return 0;
    let distance = 0;
    for (let index = 1; index < path.length; index++) {
      const previous = path[index - 1];
      const current = path[index];
      distance += _GPS.Distance(previous.lat, previous.lon, current.lat, current.lon);
    }
    return distance;
  }
  /* Internal: merge parsed packet into state, keep short-term sat caches fresh */
  updateState(data) {
    const state = this.state;
    if (data.type === "RMC" || data.type === "GGA" || data.type === "GLL" || data.type === "GNS") {
      state.time = data.time;
      state.lat = data.lat;
      state.lon = data.lon;
    }
    if (data.type === "HDT") {
      state.heading = data.heading;
      state.trueNorth = data.trueNorth;
    }
    if (data.type === "ZDA") {
      state.time = data.time;
    }
    if (data.type === "GGA") {
      state.alt = data.alt;
    }
    if (data.type === "RMC" || data.type === "VTG") {
      if (data.speed != null) state.speed = data.speed;
      if (data.track != null) state.track = data.track;
    }
    if (data.type === "GSA") {
      const systemId = data.systemId;
      if (systemId != null) this.activeSatellitesBySystem[systemId] = data.satellites;
      const activeSatellites = [];
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
    if (data.type === "GSV") {
      const now = Date.now();
      for (const satellite of data.satellites) {
        this.satelliteLastSeenAt[satellite.key] = now;
        this.satellites[satellite.key] = satellite;
      }
      const visibleSatellites = [];
      for (const [key, satellite] of Object.entries(this.satellites)) {
        if (now - this.satelliteLastSeenAt[key] < 3e3) {
          visibleSatellites.push(satellite);
        } else {
          delete this.satellites[key];
          delete this.satelliteLastSeenAt[key];
        }
      }
      state.satsVisible = visibleSatellites;
    }
  }
  assembleTXT(data) {
    if (data.total === 1) return data;
    const key = `${data.system || ""}#${data.id}`;
    let buffer = this.state.txtBuffer[key];
    if (!buffer) {
      buffer = this.state.txtBuffer[key] = {
        total: data.total,
        parts: new Array(data.total).fill(null),
        received: 0,
        timer: null
      };
      const timer = setTimeout(() => {
        this.state.errors++;
        delete this.state.txtBuffer[key];
      }, 1e4);
      timer.unref?.();
      buffer.timer = timer;
    }
    const partIndex = data.index - 1;
    if (0 <= partIndex && partIndex < buffer.total) {
      if (buffer.parts[partIndex] === null) {
        buffer.received++;
      }
      buffer.parts[partIndex] = data.part;
    }
    if (buffer.received === buffer.total) {
      if (buffer.timer !== null) clearTimeout(buffer.timer);
      delete this.state.txtBuffer[key];
      data.message = buffer.parts.join("");
      data.completed = true;
      data.rawMessages = buffer.parts;
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
  update(line) {
    const parsed = _GPS.Parse(line);
    this.state.processed++;
    if (parsed === false) {
      this.state.errors++;
      return false;
    }
    if (parsed.valid) {
      if (parsed.type === "TXT") {
        this.assembleTXT(parsed);
      }
      this.updateState(parsed);
    } else {
      this.state.errors++;
    }
    this.emit("data", parsed);
    this.emit(parsed.type, parsed);
    return true;
  }
  /**
   * Feed streaming data (chunks, possibly split arbitrarily).
   * Accepts either "\r\n" or "\n" as line delimiters.
   */
  updatePartial(chunk) {
    if (chunk) this.partialBuffer += chunk;
    while (true) {
      const newlineIndex = this.partialBuffer.indexOf("\n");
      if (newlineIndex === -1) break;
      let line = this.partialBuffer.slice(0, newlineIndex);
      this.partialBuffer = this.partialBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("$")) continue;
      try {
        this.update(line);
      } catch (err) {
        this.state.errors++;
        throw err;
      }
    }
  }
  on(event, callback) {
    const listener = callback;
    const listeners = this.events[event];
    if (listeners === void 0) {
      this.events[event] = [listener];
    } else {
      listeners.push(listener);
    }
    return this;
  }
  off(event, callback) {
    const listeners = this.events[event];
    if (listeners === void 0) return this;
    if (!callback) {
      delete this.events[event];
      return this;
    }
    const listener = callback;
    for (let index = listeners.length - 1; index >= 0; index--) {
      if (listeners[index] === listener) listeners.splice(index, 1);
    }
    if (listeners.length === 0) delete this.events[event];
    return this;
  }
  /**
   * Emit an event to all listeners.
   */
  emit(event, data) {
    const listeners = this.events[event];
    if (listeners === void 0) return;
    for (const listener of listeners) {
      listener.call(this, data);
    }
  }
};
_GPS.parsers = {
  // Global Positioning System Fix Data
  GGA(str, gga) {
    if (gga.length !== 16 && gga.length !== 14) {
      throw new Error("Invalid GGA length: " + str);
    }
    return {
      time: parseTime(gga[1]),
      lat: parseCoord(gga[2], gga[3]),
      lon: parseCoord(gga[4], gga[5]),
      alt: parseDist(gga[9], gga[10]),
      quality: parseGGAFix(gga[6]),
      satellites: parseNumber(gga[7]),
      hdop: parseNumber(gga[8]),
      // dilution
      geoidal: parseDist(gga[11], gga[12]),
      // above geoid
      age: gga[13] === void 0 ? null : parseNumber(gga[13]),
      // DGPS age
      stationID: gga[14] === void 0 ? null : parseNumber(gga[14])
      // DGPS ref
    };
  },
  // GPS DOP and active satellites
  GSA(str, gsa) {
    if (gsa.length !== 19 && gsa.length !== 20) {
      throw new Error("Invalid GSA length: " + str);
    }
    const sats = [];
    for (let fieldIndex = 3; fieldIndex < 15; fieldIndex++) {
      if (gsa[fieldIndex] !== "") sats.push(parseInt(gsa[fieldIndex], 10));
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
      throw new Error("Invalid RMC length: " + str);
    }
    return {
      time: parseTime(rmc[1], rmc[9]),
      status: parseRMC_GLLStatus(rmc[2]),
      lat: parseCoord(rmc[3], rmc[4]),
      lon: parseCoord(rmc[5], rmc[6]),
      speed: parseKnots(rmc[7]),
      track: parseNumber(rmc[8]),
      // heading (true)
      variation: parseRMCVariation(rmc[10], rmc[11]),
      faa: rmc.length > 13 ? parseFAA(rmc[12]) : null,
      navStatus: rmc.length > 14 ? parseNavigationStatus(rmc[13]) : null
    };
  },
  // Track info
  VTG(str, vtg) {
    if (vtg.length !== 10 && vtg.length !== 11) {
      throw new Error("Invalid VTG length: " + str);
    }
    if (vtg[2] === "" && vtg[8] === "" && vtg[6] === "") {
      return {
        track: null,
        trackMagnetic: null,
        speed: null,
        faa: null
      };
    }
    if (vtg[2] !== "T") {
      throw new Error("Invalid VTG track mode: " + str);
    }
    if (vtg[8] !== "K" || vtg[6] !== "N") {
      throw new Error("Invalid VTG speed tag: " + str);
    }
    return {
      track: parseNumber(vtg[1]),
      // true heading
      trackMagnetic: vtg[3] === "" ? null : parseNumber(vtg[3]),
      // magnetic
      speed: parseKnots(vtg[5]),
      faa: vtg.length === 11 ? parseFAA(vtg[9]) : null
    };
  },
  // Satellites in view
  GSV(str, gsv) {
    if (gsv.length % 4 === 0) {
      throw new Error("Invalid GSV length: " + str);
    }
    const sats = [];
    const satellite = str.slice(1, 3);
    for (let fieldIndex = 4; fieldIndex < gsv.length - 3; fieldIndex += 4) {
      const prn = parseNumber(gsv[fieldIndex]);
      const snr = parseNumber(gsv[fieldIndex + 3]);
      sats.push({
        prn,
        elevation: parseNumber(gsv[fieldIndex + 1]),
        azimuth: parseNumber(gsv[fieldIndex + 2]),
        snr,
        status: prn !== null ? snr !== null ? "tracking" : "in view" : null,
        system: parseSystem(str),
        key: satellite + prn
      });
    }
    return {
      msgNumber: parseNumber(gsv[2]),
      msgsTotal: parseNumber(gsv[1]),
      satsInView: parseNumber(gsv[3]),
      satellites: sats,
      signalId: gsv.length % 4 === 2 ? parseNumber(gsv[gsv.length - 2]) : null,
      // NMEA 4.10
      system: parseSystem(str)
    };
  },
  // Geographic Position - Latitude/Longitude
  GLL(str, gll) {
    if (gll.length !== 9 && gll.length !== 8) {
      throw new Error("Invalid GLL length: " + str);
    }
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
    return {
      time: parseTime(zda[1], zda[2] + zda[3] + zda[4]),
      // 'delta': can be derived by consumer: (Date.now() - time)/1000
      offsetMin: zda[5] === "" || zda[6] === "" ? null : (Math.sign(parseInt(zda[5], 10)) || 1) * (Math.abs(parseInt(zda[5], 10)) * 60 + parseInt(zda[6], 10))
    };
  },
  GST(str, gst) {
    if (gst.length !== 10) {
      throw new Error("Invalid GST length: " + str);
    }
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
      throw new Error("Invalid HDT length: " + str);
    }
    return {
      heading: parseFloat(hdt[1]),
      trueNorth: hdt[2] === "T"
    };
  },
  GRS(str, grs) {
    if (grs.length !== 18) {
      throw new Error("Invalid GRS length: " + str);
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
      throw new Error("Invalid GBS length: " + str);
    }
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
      throw new Error("Invalid GNS length: " + str);
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
      navStatus: gns.length === 15 ? parseNavigationStatus(gns[13]) : null
      // NMEA 4.10
    };
  },
  // Text Transmission (TXT)
  // NMEA0183-2 §6.3  ($--TXT,xx,xx,xx,c...c*hh)
  TXT(str, txt) {
    if (txt.length !== 6) {
      throw new Error("Invalid TXT length: " + str);
    }
    const total = parseInt(txt[1], 10);
    const index = parseInt(txt[2], 10);
    const textId = parseInt(txt[3], 10);
    const rawPart = txt[4] || "";
    if (!(total >= 1 && total <= 99)) throw new Error("Invalid TXT total: " + txt[1]);
    if (!(index >= 1 && index <= total)) throw new Error("Invalid TXT index: " + txt[2]);
    if (!(textId >= 0 && textId <= 99)) throw new Error("Invalid TXT id: " + txt[3]);
    if (rawPart.length > 61) throw new Error("Invalid TXT message length: " + rawPart.length);
    const part = escapeString(rawPart);
    if (part === "") throw new Error("Invalid empty TXT message");
    return {
      // assembly fields:
      total,
      index,
      id: textId,
      part,
      // decoded segment
      message: total === 1 ? part : null,
      completed: total === 1,
      rawMessages: total === 1 ? [part] : [],
      system: parseSystem(str)
      // e.g. 'GPS', 'GLONASS', ...
    };
  }
};
var GPS = _GPS;
var gps_default = GPS;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GPS
});
const GPSExport = module.exports.default;
Object.defineProperty(GPSExport, "__esModule", { value: true });
GPSExport.default = GPSExport;
GPSExport.GPS = GPSExport;
module.exports = GPSExport;
//# sourceMappingURL=gps.js.map
