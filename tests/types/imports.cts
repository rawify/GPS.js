import GPS = require('gps');

const receiver = new GPS();
const parsed = GPS.Parse('$GPZDA,201530.00,04,07,2002,00,00*60');
const distance: number = GPS.Distance(0, 0, 1, 1);
const point: GPS.LatLon = { lat: 48, lon: 9 };
const listener: GPS.GPSListener<GPS.GGA> = fix => void fix.quality;

receiver.on('GGA', (fix: GPS.GGA) => {
  const latitude: number | null = fix.lat;
  void latitude;
});

void parsed;
void distance;
void point;
void listener;
