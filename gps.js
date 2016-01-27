/**
 * GPS.js v0.0.3 26/01/2016
 *
 * Copyright (c) 2015, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/


(function(root) {
    
    var collectSats = [];
    
    function updateState(state, data) {
        
        if (data['type'] === 'RMC' || data['type'] === 'GGA') {
            state['time'] = data['time'];
            state['lat'] = data['lat'];
            state['lon'] = data['lon'];
        }

        if (data['type'] === 'GGA') {
            state['alt'] = data['alt'];
        }

        if (data['type'] === 'RMC' || data['type'] === 'VTG') {
            // TODO: is rmc speed/track really interchangeable with vtg speed/track?
            state['speed'] = data['speed'];
            state['track'] = data['track'];
        }

        if (data['type'] === 'GSA') {
            state['sats_active'] = data['satellites'];
        }

        if (data['type'] === 'GSV') {
            
            var sats = data['satellites'];
            for (var i = 0; i < sats.length; i++) {
                collectSats.push(sats[i]);
            }
            
            // Reset stats
            if (data['msgNumber'] === data['msgsTotal']) {
                state['sats_visible'] = collectSats;
                collectSats = [];
            }
        }
    }

    function parseTime(time, date) {

        var ret = new Date;

        if (date) {
            ret.setUTCFullYear("20" + date.slice(4, 6), date.slice(2, 4) - 1, date.slice(0, 2));
        }


        ret.setUTCHours(time.slice(0, 2));
        ret.setUTCMinutes(time.slice(2, 4));
        ret.setUTCSeconds(time.slice(4, 6));
        ret.setUTCMilliseconds(parseFloat(time.slice(7)) || 0);

        return ret;
    }

    function parseCoord(coord, dir) {

        if (coord === "")
            return null;

        var n, sgn = 1;

        switch (dir) {

            case "S":
                sgn = -1;
            case "N":
                n = 2;
                break;

            case "W":
                sgn = -1;
            case "E":
                n = 3;
                break;
        }
        return sgn * (parseFloat(coord.slice(0, n)) + parseFloat(coord.slice(n)) / 60);
    }

    function parseNumber(num) {

        if (num === "") {
            return null;
        }
        return parseFloat(num);
    }

    function parseKnots(knots) {

        if (knots === "")
            return null;

        return parseFloat(knots) * 1.852;
    }

    function parseGSAMode(mode) {

        switch (mode) {
            case "M":
                return "manual";
            case "A":
                return "auto";
            case "":
                return null;
        }
        throw "INVALID GSA MODE: " + mode;
    }

    function parseGSAFix(fix) {

        switch (fix) {
            case "1":
                return null;
            case "2":
                return "2D";
            case "3":
                return "3D";
            case "":
                return null;
        }
        throw "INVALID GSA FIX: " + fix;
    }

    function parseRMCStatus(status) {

        switch (status) {
            case "A":
                return "active";
            case "V":
                return "void";
            case "":
                return null;
        }
        throw "INVALID RSA STATUS: " + status;
    }

    function parseRMCVariation(vari, dir) {

        if (vari === "" || dir === "")
            return null;

        var q = (dir === "W") ? -1.0 : 1.0;

        return parseFloat(vari) * q;
    }

    function isValid(str, crc) {

        var checksum = 0;
        for (var i = 1; i < str.length; i++) {
            var c = str.charCodeAt(i);

            if (c === 42) // Asterisk: *
                break;

            checksum ^= c;
        }
        return checksum === parseInt(crc, 16);
    }

    function parseDist(num, unit) {

        if (unit === "M") {
            return parseNumber(num);
        }
        throw "Unknown unit: " + unit;
    }


    function GPS() {
    }

    GPS.prototype["events"] = {};
    GPS.prototype["state"] = {};
    
    GPS.prototype["mod"] = {
        
    "GGA": function(str, gga) {

        if (gga.length !== 16) {
            throw "Invalid GGA length: " + str;
        }

        var FIX_TYPE = ["invalid", "fix", "diff"];

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
            0 - fix not available,
            1 - GPS fix,
            2 - Differential GPS fix
         7) Number of satellites in view, 00 - 12
         8) Horizontal Dilution of precision
         9) Antenna Altitude above/below mean-sea-level (geoid)
        10) Units of antenna altitude, meters
        11) Geoidal separation, the difference between the WGS-84 earth
            ellipsoid and mean-sea-level (geoid), "-" means mean-sea-level below ellipsoid
        12) Units of geoidal separation, meters
        13) Age of differential GPS data, time in seconds since last SC104
            type 1 or 9 update, null field when DGPS is not used
        14) Differential reference station ID, 0000-1023
        15) Checksum
        */

        return {
            "type"        : gga[0],
            "time"        : parseTime(gga[1]),
            "lat"         : parseCoord(gga[2], gga[3]),
            "lon"         : parseCoord(gga[4], gga[5]),
            "alt"         : parseDist(gga[9], gga[10]),
            "quality"     : FIX_TYPE[+gga[6]],
            "satelites"   : parseNumber(gga[7]),
            "hdop"        : parseNumber(gga[8]), // dilution
            "geoidal"     : parseDist(gga[11], gga[12]), // aboveGeoid
            "age"         : parseNumber(gga[13]), // dgpsUpdate???
            "stationID"   : parseNumber(gga[14]), // dgpsReference??
            "valid"       : isValid(str, gga[15])
        };
    },

    // Active satellites
    "GSA": function(str, gsa) {

        if (gsa.length !== 19) {
            throw "Invalid GSA length: " + str;
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
         3-14 = IDs of SVs used in position fix (null for unused fields)
         15   = PDOP
         16   = HDOP
         17   = VDOP
         18   = Checksum
         */

        var sats = [];
        for (var i = 3; i < 12 + 3; i++) {

            if (gsa[i] !== "") {
                sats.push(parseInt(gsa[i], 10));
            }
        }

        return {
            "type"        : gsa[0],
            "mode"        : parseGSAMode(gsa[1]),
            "fix"         : parseGSAFix(gsa[2]),
            "satellites"  : sats,
            "pdop"        : parseNumber(gsa[15]),
            "vdop"        : parseNumber(gsa[16]),
            "hdop"        : parseNumber(gsa[17]),
            "valid"       : isValid(str, gsa[18])
        };
    },

    // Recommended Minimum sentence C
    "RMC": function(str, rmc) {

        if (rmc.length !== 13) {
            throw "Invalid RMC length: " + str;
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
         12   = Checksum
         */

        return {
            "type"        : rmc[0],
            "time"        : parseTime(rmc[1], rmc[9]),
            "status"      : parseRMCStatus(rmc[2]),
            "lat"         : parseCoord(rmc[3], rmc[4]),
            "lon"         : parseCoord(rmc[5], rmc[6]),
            "speed"       : parseKnots(rmc[7]),
            "track"       : parseNumber(rmc[8]),
            "variation"   : parseRMCVariation(rmc[10], rmc[11]),
            "valid"       : isValid(str, rmc[12])
        };
    },

    // Track info
    "VTG": function(str, vtg) {

        if (vtg.length !== 10 && vtg.length !== 11) {
            throw "Invalid VTG length: " + str;
        }

        /*
        ------------------------------------------------------------------------------
        1  2  3  4  5  6  7  8 9   10
        |  |  |  |  |  |  |  | |   |
        $--VTG,x.x,T,x.x,M,x.x,N,x.x,K,m,*hh<CR><LF>
        ------------------------------------------------------------------------------

         1    = Track degrees
         2    = Fixed text "T" indicates that track made good is relative to true north
         3    = not used
         4    = not used
         5    = Speed over ground in knots
         6    = Fixed text "N" indicates that speed over ground in in knots
         7    = Speed over ground in kilometers/hour
         8    = Fixed text "K" indicates that speed over ground is in kilometers/hour
        (9)   = FAA mode indicator (NMEA 2.3 and later)
         9/10 = Checksum
         */

        if (vtg[2] !== "T") {
            // Track mode not okay
            return null;
        }

        if (vtg[8] !== "K" || vtg[6] !== "N") {
            throw "Invalid VTG speed tag: " + str;
        }

        return {
            "type"        : vtg[0],
            "track"       : parseNumber(vtg[1]),
            "speed"       : parseKnots(vtg[5]),
            "valid"       : isValid(str, vtg[vtg.length - 1])
        };
    },

    // satelites in view
    "GSV": function(str, gsv) {

        if (gsv.length < 9 || gsv.length % 4 !== 1) {
            throw "Invalid GSV length: " + str;
        }

        /*
         $GPGSV,1,1,13,02,02,213,,03,-3,000,,11,00,121,,14,13,172,05*67

         1    = Total number of messages of this type in this cycle
         2    = Message number
         3    = Total number of SVs in view
         4    = SV PRN number
         5    = Elevation in degrees, 90 maximum
         6    = Azimuth, degrees from true north, 000 to 359
         7    = SNR (signal to noise ratio), 00-99 dB (null when not tracking, higher is better)
         8-11 = Information about second SV, same as field 4-7
         12-15= Information about third SV, same as field 4-7
         16-19= Information about fourth SV, same as field 4-7
         8/12/16/20   = Checksum
         */

        var sats = [];

        for (var i = 4; i < gsv.length - 1; i += 4) {

            sats.push({
                "prn"         : parseNumber(gsv[i    ]),
                "elevation"   : parseNumber(gsv[i + 1]),
                "azimuth"     : parseNumber(gsv[i + 2]),
                "snr"         : parseNumber(gsv[i + 3])
            });
        }

        return {
            "type"        : gsv[0],
            "msgNumber"   : parseNumber(gsv[2]),
            "msgsTotal"   : parseNumber(gsv[1]),
            //"satsInView"  : parseNumber(gsv[3]), // Can be obtained by satellites.length
            "satellites"  : sats,
            "valid"       : isValid(str, gsv[gsv.length - 1])
        };
    }
        
    };


    GPS.prototype["update"] = function(line) {

        if (typeof line !== "string")
            return false;

        var nmea = line.split(",");

        var last = nmea.pop();

        if (nmea.length < 4 || line.charAt(0) !== "$" || last.indexOf("*") === -1) {
            return false;
        }

        last = last.split("*");
        nmea.push(last[0]);
        nmea.push(last[1]);

        // Remove $ character and first two chars from the beginning
        nmea[0] = nmea[0].slice(3);

        if (this["mod"][nmea[0]] !== undefined) {

            var tmp = this["mod"][nmea[0]](line, nmea);

            updateState(this.state, tmp);

            if (this["events"]["data"] !== undefined) {
                this["events"]["data"](line, tmp);
            }

            if (this["events"][nmea[0]] !== undefined) {
                this["events"][nmea[0]](tmp);
            }
        }
        return true;
    };

    GPS.prototype["on"] = function(ev, cb) {

        if (this["events"][ev] === undefined) {
            this["events"][ev] = cb;
            return this;
        }
        return null;
    };

    GPS.prototype["off"] = function(ev) {

        if (this["events"][ev] !== undefined) {
            this["events"][ev] = undefined;
        }
        return this;
    };

    if (typeof exports === "object") {
        module.exports = GPS;
    } else {
        root["GPS"] = GPS;
    }
    
})(this);
