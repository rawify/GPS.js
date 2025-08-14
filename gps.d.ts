export as namespace gps;
export = GPS;

declare class GPS {
    /** Mutable parser state aggregated from recent sentences */
    state: GPS.GPSState;

    /**
     * Parse a full NMEA sentence and emit events.
     * @param line NMEA string (must start with '$' and contain '*xx' checksum)
     * @returns true if parsed (even if checksum invalid), false if sentence structure was rejected
     */
    update(line: string): boolean;

    /**
     * Feed streaming chunks; calls update() whenever a full line is assembled.
     * Accepts both CRLF and LF as delimiters.
     */
    updatePartial(chunk: string): void;

    /**
     * Subscribe to an event ('data' for all sentences or a concrete type like 'GGA', 'RMC', ...).
     * Multiple listeners per event are supported.
     */
    on(event: string, callback: (data: any) => void): GPS;

    /**
     * Remove listeners. If callback omitted, removes all listeners for the event.
     */
    off(event: string, callback?: (data: any) => void): GPS;

    /**
     * Parse a single line without using the event system.
     * Returns the typed NMEA object (with `.raw`, `.valid`, `.type`) or false if unrecognized/invalid structure.
     */
    static Parse(line: string): false | GPS.NMEA;

    /**
     * Haversine distance in kilometers
     */
    static Distance(
        latFrom: number,
        lonFrom: number,
        latTo: number,
        lonTo: number
    ): number;

    /**
     * Sum of pairwise distances along a path
     */
    static TotalDistance(points: GPS.LatLon[]): number;

    /**
     * Initial bearing (windrose: N=0, E=90, S=180, W=270)
     */
    static Heading(
        latFrom: number,
        lonFrom: number,
        latTo: number,
        lonTo: number
    ): number;
}

declare namespace GPS {

    /* ---------- Shared ---------- */

    export interface LatLon {
        lat: number;
        lon: number;
    }

    /** Aggregated state built from recent sentences. All optional fields may be absent or null until observed. */
    export interface GPSState {
        [key: string]: any;
        processed: number;
        errors: number;

        time?: Date | null;
        lat?: number | null;
        lon?: number | null;
        alt?: number | null;

        speed?: number | null;
        track?: number | null;

        heading?: number | null;       // from HDT
        trueNorth?: boolean | null;     // from HDT

        // Fix quality from GSA
        fix?: '2D' | '3D' | null;
        hdop?: number | null;
        pdop?: number | null;
        vdop?: number | null;

        satsActive?: number[] | null;   // PRNs used in fix (across systems)
        satsVisible?: Satellite[] | null; // deduped & time-windowed set

        // Additional fields (not exhaustive): may appear depending on sentences seen
        geoidal?: number | null;
    }

    /* ---------- Sentence payloads (all include raw/valid/type) ---------- */

    export interface GGA {
        time: Date | null;
        lat: number | null;
        lon: number | null;
        alt: number | null;
        quality?: GGAQuality | null;
        satellites: number | null;
        hdop: number | null;
        geoidal: number | null;
        age: number | null;
        stationID: number | null;
        raw: string;
        valid: boolean;
        type: 'GGA';
    }

    export enum GGAQuality {
        fix = 'fix',
        'dgps-fix' = 'dgps-fix',
        'pps-fix' = 'pps-fix',
        rtk = 'rtk',
        'rtk-float' = 'rtk-float',
        estimated = 'estimated',
        manual = 'manual',
        simulated = 'simulated'
    }

    export interface GSA {
        mode?: 'manual' | 'automatic' | null;
        fix?: '2D' | '3D' | null;
        satellites: number[];              // PRNs
        pdop: number | null;
        hdop: number | null;
        vdop: number | null;
        systemId?: number | null;          // NMEA 4.10
        system?: string;                   // 'GPS' | 'GLONASS' | ...
        raw: string;
        valid: boolean;
        type: 'GSA';
    }

    export interface RMC {
        time: Date | null;
        status?: 'active' | 'void' | null;
        lat: number | null;
        lon: number | null;
        speed: number | null;              // km/h
        track: number | null;              // degrees true
        variation: number | null;          // signed, E/W applied
        faa?: FAAMode | null;
        navStatus?: string | null;         // NMEA 4.10
        raw: string;
        valid: boolean;
        type: 'RMC';
    }

    export interface VTG {
        track: number | null;              // degrees true
        trackMagnetic: number | null;
        speed: number | null;              // km/h
        faa: FAAMode | null;
        raw: string;
        valid: boolean;
        type: 'VTG';
    }

    export interface TXT {
        total: number;
        index: number;
        id: number;
        part: string;                 // decoded segment
        message: string | null;       // full text when completed
        completed: boolean;
        rawMessages: string[];        // all parts when completed
        system?: string;
        raw: string;
        valid: boolean;
        type: 'TXT';
    }

    /** FAA mode (decoded human-readable strings) */
    export type FAAMode =
        | 'autonomous'
        | 'differential'
        | 'estimated'
        | 'manual input'
        | 'simulated'
        | 'not valid'
        | 'precise'
        | 'rtk'
        | 'rtk-float';

    export interface GSV {
        msgNumber: number | null;
        msgsTotal: number | null;
        satsInView: number | null;
        satellites: Satellite[];
        signalId?: number | null;          // NMEA 4.10
        system?: string;                   // talker-derived ('GPS', 'GLONASS', ...)
        raw: string;
        valid: boolean;
        type: 'GSV';
    }

    export interface Satellite {
        prn: number | null;
        elevation: number | null;
        azimuth: number | null;
        snr: number | null;
        /** 'tracking' | 'in view' | null */
        status: string | null;
        /** System derived from talker (e.g., 'GPS', 'GLONASS', 'Galileo', 'BeiDou', 'QZSS') */
        system: string;
        /** Unique key like "GP12" used internally for visibility tracking */
        key: string;
    }

    export interface GLL {
        time: Date | null;
        status?: 'active' | 'void' | null;
        lat: number | null;
        lon: number | null;
        faa?: FAAMode | null;
        raw: string;
        valid: boolean;
        type: 'GLL';
    }

    export interface ZDA {
        time: Date | null;
        offsetMin: number | null;
        raw: string;
        valid: boolean;
        type: 'ZDA';
    }

    export interface GST {
        time: Date | null;
        rms: number | null;
        ellipseMajor: number | null;
        ellipseMinor: number | null;
        ellipseOrientation: number | null;
        latitudeError: number | null;
        longitudeError: number | null;
        heightError: number | null;
        raw: string;
        valid: boolean;
        type: 'GST';
    }

    export interface HDT {
        heading: number;       // parsed as number; sentence requires a value
        trueNorth: boolean;    // 'T'
        raw: string;
        valid: boolean;
        type: 'HDT';
    }

    export interface GRS {
        time: Date | null;
        mode: number | null;
        /** residuals present in fields 3..14 (filtered to numeric) */
        res: number[];
        raw: string;
        valid: boolean;
        type: 'GRS';
    }

    export interface GBS {
        time: Date | null;
        errLat: number | null;
        errLon: number | null;
        errAlt: number | null;
        failedSat: number | null;
        probFailedSat: number | null;
        biasFailedSat: number | null;
        stdFailedSat: number | null;
        systemId?: number | null;          // NMEA 4.10
        signalId?: number | null;          // NMEA 4.10
        raw: string;
        valid: boolean;
        type: 'GBS';
    }

    export interface GNS {
        time: Date | null;
        lat: number | null;
        lon: number | null;
        mode: string | null;               // multi-constellation mode chars (as-is)
        satsUsed: number | null;
        hdop: number | null;
        alt: number | null;
        sep: number | null;
        diffAge: number | null;
        diffStation: number | null;
        navStatus?: string | null;         // NMEA 4.10
        raw: string;
        valid: boolean;
        type: 'GNS';
    }

    /** Union of all sentence payloads produced by GPS.Parse / events */
    export type NMEA =
        | GGA
        | GSA
        | RMC
        | VTG
        | GSV
        | GLL
        | ZDA
        | GST
        | HDT
        | GRS
        | GBS
        | GNS
        | TXT;
}
