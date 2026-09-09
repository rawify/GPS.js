import type { GPS as GPSConstructor } from './gps.d.mts';

declare const GPS: typeof GPSConstructor;

declare namespace GPS {
  type FAAMode = import('./types.d.mts').FAAMode;
  type GBS = import('./types.d.mts').GBS;
  type GGA = import('./types.d.mts').GGA;
  type GGAQuality = import('./types.d.mts').GGAQuality;
  type GLL = import('./types.d.mts').GLL;
  type GNS = import('./types.d.mts').GNS;
  type GRS = import('./types.d.mts').GRS;
  type GSA = import('./types.d.mts').GSA;
  type GST = import('./types.d.mts').GST;
  type GPSState = import('./types.d.mts').GPSState;
  type GSV = import('./types.d.mts').GSV;
  type HDT = import('./types.d.mts').HDT;
  type LatLon = import('./types.d.mts').LatLon;
  type NavigationStatus = import('./types.d.mts').NavigationStatus;
  type NMEA = import('./types.d.mts').NMEA;
  type NMEAByType = import('./types.d.mts').NMEAByType;
  type GPSListener<T extends NMEA = NMEA> = import('./gps.d.mts').GPSListener<T>;
  type RMC = import('./types.d.mts').RMC;
  type Satellite = import('./types.d.mts').Satellite;
  type TXT = import('./types.d.mts').TXT;
  type VTG = import('./types.d.mts').VTG;
  type ZDA = import('./types.d.mts').ZDA;
}

export = GPS;
