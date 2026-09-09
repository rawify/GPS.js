export interface LatLon {
    lat: number;
    lon: number;
}
export type GGAQuality = 'fix' | 'dgps-fix' | 'pps-fix' | 'rtk' | 'rtk-float' | 'estimated' | 'manual' | 'simulated';
export type FAAMode = 'autonomous' | 'differential' | 'estimated' | 'manual input' | 'simulated' | 'not valid' | 'precise' | 'rtk' | 'rtk-float';
export type NavigationStatus = 'safe' | 'caution' | 'unsafe' | 'not valid';
export interface Satellite {
    prn: number | null;
    elevation: number | null;
    azimuth: number | null;
    snr: number | null;
    status: 'tracking' | 'in view' | null;
    system: string;
    key: string;
}
interface SentenceBase<T extends string> {
    raw: string;
    valid: boolean;
    type: T;
}
export interface GGA extends SentenceBase<'GGA'> {
    time: Date | null;
    lat: number | null;
    lon: number | null;
    alt: number | null;
    quality: GGAQuality | null;
    satellites: number | null;
    hdop: number | null;
    geoidal: number | null;
    age: number | null;
    stationID: number | null;
}
export interface GSA extends SentenceBase<'GSA'> {
    mode: 'manual' | 'automatic' | null;
    fix: '2D' | '3D' | null;
    satellites: number[];
    pdop: number | null;
    hdop: number | null;
    vdop: number | null;
    systemId: number | null;
    system: string;
}
export interface RMC extends SentenceBase<'RMC'> {
    time: Date | null;
    status: 'active' | 'void' | null;
    lat: number | null;
    lon: number | null;
    speed: number | null;
    track: number | null;
    variation: number | null;
    faa: FAAMode | null;
    navStatus: NavigationStatus | null;
}
export interface VTG extends SentenceBase<'VTG'> {
    track: number | null;
    trackMagnetic: number | null;
    speed: number | null;
    faa: FAAMode | null;
}
export interface GSV extends SentenceBase<'GSV'> {
    msgNumber: number | null;
    msgsTotal: number | null;
    satsInView: number | null;
    satellites: Satellite[];
    signalId: number | null;
    system: string;
}
export interface GLL extends SentenceBase<'GLL'> {
    time: Date | null;
    status: 'active' | 'void' | null;
    lat: number | null;
    lon: number | null;
    faa: FAAMode | null;
}
export interface ZDA extends SentenceBase<'ZDA'> {
    time: Date | null;
    offsetMin: number | null;
}
export interface GST extends SentenceBase<'GST'> {
    time: Date | null;
    rms: number | null;
    ellipseMajor: number | null;
    ellipseMinor: number | null;
    ellipseOrientation: number | null;
    latitudeError: number | null;
    longitudeError: number | null;
    heightError: number | null;
}
export interface HDT extends SentenceBase<'HDT'> {
    heading: number;
    trueNorth: boolean;
}
export interface GRS extends SentenceBase<'GRS'> {
    time: Date | null;
    mode: number | null;
    res: number[];
}
export interface GBS extends SentenceBase<'GBS'> {
    time: Date | null;
    errLat: number | null;
    errLon: number | null;
    errAlt: number | null;
    failedSat: number | null;
    probFailedSat: number | null;
    biasFailedSat: number | null;
    stdFailedSat: number | null;
    systemId: number | null;
    signalId: number | null;
}
export interface GNS extends SentenceBase<'GNS'> {
    time: Date | null;
    lat: number | null;
    lon: number | null;
    mode: string;
    satsUsed: number | null;
    hdop: number | null;
    alt: number | null;
    sep: number | null;
    diffAge: number | null;
    diffStation: number | null;
    navStatus: NavigationStatus | null;
}
export interface TXT extends SentenceBase<'TXT'> {
    total: number;
    index: number;
    id: number;
    part: string;
    message: string | null;
    completed: boolean;
    rawMessages: string[];
    system: string;
}
export type NMEA = GGA | GSA | RMC | VTG | GSV | GLL | ZDA | GST | HDT | GRS | GBS | GNS | TXT;
export interface NMEAByType {
    GGA: GGA;
    GSA: GSA;
    RMC: RMC;
    VTG: VTG;
    GSV: GSV;
    GLL: GLL;
    ZDA: ZDA;
    GST: GST;
    HDT: HDT;
    GRS: GRS;
    GBS: GBS;
    GNS: GNS;
    TXT: TXT;
}
export interface GPSState {
    [key: string]: unknown;
    processed: number;
    errors: number;
    time?: Date | null;
    lat?: number | null;
    lon?: number | null;
    alt?: number | null;
    speed?: number | null;
    track?: number | null;
    heading?: number | null;
    trueNorth?: boolean | null;
    fix?: '2D' | '3D' | null;
    hdop?: number | null;
    pdop?: number | null;
    vdop?: number | null;
    satsActive?: number[];
    satsVisible?: Satellite[];
    geoidal?: number | null;
}
export {};
