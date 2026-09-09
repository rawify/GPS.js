/**
 * @license GPS.js v0.9.0 9/9/2026
 * https://raw.org/software/libraries/gps-js/
 *
 * Copyright (c) 2026, Robert Eisele (https://raw.org/)
 * Licensed under the MIT license.
 **/
import type { GPSState, LatLon, NMEA, NMEAByType } from './types.d.mts';
export type { FAAMode, GBS, GGA, GGAQuality, GLL, GNS, GRS, GSA, GST, GPSState, GSV, HDT, LatLon, NavigationStatus, NMEA, NMEAByType, RMC, Satellite, TXT, VTG, ZDA, } from './types.d.mts';
interface TXTBuffer {
    total: number;
    parts: Array<string | null>;
    received: number;
    timer: ReturnType<typeof setTimeout> | null;
}
type SentencePayload<T extends NMEA> = T extends NMEA ? Omit<T, 'raw' | 'valid' | 'type'> : never;
type Parser<T extends NMEA = NMEA> = (sentence: string, fields: string[]) => SentencePayload<T>;
type ParserRegistry = {
    [Type in keyof NMEAByType]: Parser<NMEAByType[Type]>;
};
export type GPSListener<T extends NMEA = NMEA> = (data: T) => void;
type StoredGPSListener = GPSListener<NMEA>;
type InternalGPSState = GPSState & {
    txtBuffer: Record<string, TXTBuffer>;
};
export declare class GPS {
    readonly events: Record<string, StoredGPSListener[]>;
    readonly state: InternalGPSState;
    private readonly satellites;
    private readonly activeSatellitesBySystem;
    private readonly satelliteLastSeenAt;
    private partialBuffer;
    static readonly parsers: ParserRegistry;
    static Parse(line: string): false | NMEA;
    static Heading(latFrom: number, lonFrom: number, latTo: number, lonTo: number): number;
    static Distance(latFrom: number, lonFrom: number, latTo: number, lonTo: number): number;
    static TotalDistance(path: readonly LatLon[]): number;
    private updateState;
    private assembleTXT;
    /**
     * Feed one full NMEA line (starting with '$', ending before CRLF).
     * Emits both 'data' and '<type>' events on success.
     */
    update(line: string): boolean;
    /**
     * Feed streaming data (chunks, possibly split arbitrarily).
     * Accepts either "\r\n" or "\n" as line delimiters.
     */
    updatePartial(chunk: string): void;
    /**
     * Subscribe to an event. Multiple listeners per event are supported.
     * @returns {GPS} this (chainable)
     */
    on(event: 'data', callback: GPSListener): this;
    on<T extends keyof NMEAByType>(event: T, callback: GPSListener<NMEAByType[T]>): this;
    /**
     * Remove listeners. If cb omitted, remove all for the event.
     * @returns {GPS} this
     */
    off(event: 'data', callback?: GPSListener): this;
    off<T extends keyof NMEAByType>(event: T, callback?: GPSListener<NMEAByType[T]>): this;
    /**
     * Emit an event to all listeners.
     */
    emit(event: string, data: NMEA): void;
}
export default GPS;
