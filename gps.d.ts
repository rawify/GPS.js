export as namespace gps;

export = GPS;

declare class GPS {
    state: GPS.GPSState;

    /**
     * The update method is the most important export function, it parses a NMEA sentence and forces the callbacks to trigger
     * @param line NMEA string
     * @returns is valid
     */
    update(line: string): boolean;

    /**
     * Will call update() when a full NMEA sentence has been arrived
     * @param chunk Partial NMEA string
     */
    updatePartial(chunk: string): void;

    /**
     * Adds an event listener for a protocol to occur (see implemented protocols, simply use the name - upper case) or for all sentences with data.
     * Because GPS.js should be more general, it doesn't inherit EventEmitter, but simply invokes the callback.
     * @param event "error"
     * @param callback Callback with the error string
     * @returns GPS instance
     */
    on(event: "error", callback: (errorMessage: string) => void): GPS;

    /**
     * Adds an event listener for a protocol to occur (see implemented protocols, simply use the name - upper case) or for all sentences with data.
     * Because GPS.js should be more general, it doesn't inherit EventEmitter, but simply invokes the callback.
     * @param event Event type
     * @param callback Callback with data
     * @returns GPS instance
     */
    on(event: string, callback: (data: any) => void): GPS;

    /**
     * Removes an event listener
     * @param event Event type
     * @returns GPS instance
     */
    off(event: string): GPS;

    /**
     * Parses a single line and returns the resulting object, in case the callback system isn't needed/wanted
     * @param line NMEA string
     * @returns NMEA object or False
     */
    static Parse<T = any>(line: string): false | T;

    /**
     * Calculates the distance between two geo-coordinates using Haversine formula
     * @param latFrom
     * @param lonFrom
     * @param latTo
     * @param lonTo
     * @returns Distance in km
     */
    static Distance(
        latFrom: number,
        lonFrom: number,
        latTo: number,
        lonTo: number
    ): number;

    /**
     * Calculates the length of a traveled route, given as an array of {lat: x, lon: y} point objects
     * @param points Array of {lat: x, lon: y}
     * @returns Distance in km
     */
    static TotalDistance(points: GPS.LatLon[]): number;

    /**
     * Calculates the angle from one coordinate to another. Heading is represented as windrose coordinates (N=0, E=90, S=189, W=270)
     * @param latFrom
     * @param lonFrom
     * @param latTo
     * @param lonTo
     * @returns Heading in degrees
     */
    static Heading(
        latFrom: number,
        lonFrom: number,
        latTo: number,
        lonTo: number
    ): number;
}

declare namespace GPS {

    export interface LatLon {
        lat: number;
        lon: number;
    }

    export interface GPSState {
        [key: string]: any;
        processed: number;
        errors: number;
        errorDescriptions: string[]

        time?: Date;
        lat?: number;
        lon?: number;
        alt?: number;
        speed?: number;
        track?: number;
        satsActive?: number[];
        satsVisible?: Satellite[];
    }

    export interface GGA {
        time: Date;
        lat: number;
        lon: number;
        alt: number;
        quality?: GGAQuality;
        satellites: number;
        hdop: number;
        geoidal: number;
        age: number;
        stationID: number;
        raw: string;
        valid: boolean;
        type: 'GGA';
    }

    export enum GGAQuality {
        'fix'       = 1,
        'dgps-fix'  = 2,
        'pps-fix'   = 3,
        'rtk'       = 4,
        'rtk-float' = 5,
        'estimated' = 6,
        'manual'    = 7,
        'simulated' = 8
    }

    export interface GSA {
        mode?: 'manual'|'automatic';
        fix?: '2D'|'3D';
        satellites: number[];
        pdop: number;
        hdop: number;
        vdop: number;
        raw: string;
        valid: boolean;
        type: 'GSA';
    }

    export interface RMC {
        time: Date;
        status?: 'active'|'void';
        lat: number;
        lon: number;
        speed: number;
        track: number;
        variation: number;
        faa: FAA;
        raw: string;
        valid: boolean;
        type: 'RMC';
    }

    export interface VTG {
        track: number;
        trackMagnetic: number;
        speed: number;
        faa: FAA;
        raw: string;
        valid: boolean;
        type: 'VTG';
    }

    export enum FAA {
        'autonomous'    = 'A',
        'differential'  = 'D',
        'estimated'     = 'E',
        'manual input'  = 'M',
        'simulated'     = 'S',
        'not valid'     = 'N',
        'precise'       = 'P'
    }

    export interface GSV {
        msgNumber: number;
        msgsTotal: number;
        satellites: Satellite[];
        raw: string;
        valid: boolean;
        type: 'GSV';
    }

    export interface Satellite {
        prn: number;
        elevation: number;
        azimuth: number;
        snr: number;
        status: string;
    }

    export interface GLL {
        time: Date;
        status?: 'active'|'void';
        lat: number;
        lon: number;
        raw: string;
        valid: boolean;
        type: 'GLL';
    }

    export interface ZDA {
        time: Date;
        raw: string;
        valid: boolean;
        type: 'ZDA';
    }

    export interface GST {
        time: Date;
        rms: number;
        ellipseMajor: number;
        ellipseMinor: number;
        ellipseOrientation: number;
        latitudeError: number;
        longitudeError: number;
        heightError: number;
        raw: string;
        valid: boolean;
        type: 'GST';
    }

    export interface HDT {
        heading: number;
        trueNorth: boolean;
        raw: string;
        valid: boolean;
        type: 'HDT';
    }

    export interface TXT {
        message: string | null
        completed: boolean,
        rawMessages: string[],
        sentenceAmount: number,
    }  
}
