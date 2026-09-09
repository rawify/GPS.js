import GPS, { GPS as NamedGPS, type GGA, type LatLon, type NMEA } from 'gps';

const receiver = new GPS();
const namedReceiver = new NamedGPS();
const point: LatLon = { lat: 48, lon: 9 };
const parsed: false | NMEA = GPS.Parse('$GPZDA,201530.00,04,07,2002,00,00*60');

receiver.on('GGA', (fix: GGA) => {
  const latitude: number | null = fix.lat;
  void latitude;
});

void namedReceiver;
void point;
void parsed;
