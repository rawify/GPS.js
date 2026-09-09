![GPS.js](https://github.com/rawify/GPS.js/blob/main/res/logo.png?raw=true "JavaScript GPS parser")

[![npm package](https://img.shields.io/npm/v/gps.svg?style=flat)](https://www.npmjs.com/package/gps)
[![MIT license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

# GPS.js

GPS.js is a typed NMEA 0183 parser for GPS and GNSS receivers. It parses individual sentences, consumes arbitrarily split streams, emits sentence-specific events, and maintains a normalized receiver state.

The library handles supplied NMEA text only. Opening serial devices, sockets, and other transports remains an application concern.

Project page: [raw.org/software/libraries/gps-js](https://raw.org/software/libraries/gps-js/)

## Installation

GPS.js 0.9 requires Node.js 20 or newer.

```bash
npm install gps
```

## Quick Start

```javascript
import GPS from 'gps';

const gps = new GPS();

gps.on('GGA', fix => {
  console.log(fix.lat, fix.lon, fix.alt);
});

gps.update(
  '$GPGGA,224900.000,4832.3762,N,00903.5393,E,1,04,7.8,498.6,M,48.0,M,,0000*5E'
);
```

CommonJS is supported as well:

```javascript
const GPS = require('gps');
const gps = new GPS();
```

The package includes TypeScript declarations. Event names narrow callback payloads automatically:

```typescript
import GPS from 'gps';

const gps = new GPS();

gps.on('RMC', record => {
  record.speed;     // number | null, in km/h
  record.navStatus; // safe | caution | unsafe | not valid | null
});
```

## Parsing Sentences

Use `GPS.Parse()` when accumulated receiver state and events are unnecessary:

```javascript
import GPS from 'gps';

const sentence = '$GPGGA,224900.000,4832.3762,N,00903.5393,E,1,04,7.8,498.6,M,48.0,M,,0000*5E';
const fix = GPS.Parse(sentence);

if (fix && fix.valid && fix.type === 'GGA') {
  console.log(fix.lat, fix.lon, fix.alt);
}
```

`GPS.Parse()` returns `false` for unsupported or structurally rejected input. A recognized sentence with a bad checksum is returned with `valid: false`.

`gps.update()` emits recognized checksum-invalid records so applications can inspect reception errors, but does not merge them into `gps.state` or multipart TXT buffers. Both rejected and checksum-invalid input increment `state.errors`.

## Streaming Input

`updatePartial()` buffers incomplete chunks and accepts CRLF or LF delimiters:

```javascript
const gps = new GPS();

gps.on('data', record => console.log(record));

gps.updatePartial('$GPGGA,224900.000,4832.3762,N,');
gps.updatePartial('00903.5393,E,1,04,7.8,498.6,M,48.0,M,,0000*5E\r\n');
```

## Events

Subscribe to `data` for every parsed sentence or use a sentence identifier such as `GGA`, `RMC`, or `GSV`:

```javascript
const onFix = fix => console.log(fix);

gps.on('GGA', onFix);
gps.off('GGA', onFix);
gps.off('GGA'); // Remove every GGA listener.
```

`on()` and `off()` return the receiver instance for chaining.

## Receiver State

`gps.state` is updated in place as valid sentences arrive. It includes counters and the latest available navigation values:

```javascript
gps.on('data', record => {
  if (record.valid) {
    console.log(gps.state.lat, gps.state.lon, gps.state.speed);
  }
});
```

Depending on the received sentences, state may contain `time`, `lat`, `lon`, `alt`, `speed`, `track`, `heading`, `fix`, dilution values, active satellite IDs, and visible satellite records. Snapshot values when historical states are needed.

## Supported Sentences

| Sentence | Data |
| --- | --- |
| `GGA` | Fix position, quality, altitude, and dilution |
| `GSA` | Fix mode, active satellites, dilution, and GNSS system |
| `RMC` | Position, speed, track, date, mode, and navigation status |
| `VTG` | True/magnetic track and speed |
| `GSV` | Satellites in view, signal strength, and GNSS system |
| `GLL` | Geographic position and status |
| `ZDA` | UTC date/time and local offset |
| `GST` | Position error statistics |
| `HDT` | Heading relative to true north |
| `GRS` | Range residuals |
| `GBS` | Satellite fault detection data |
| `GNS` | Multi-constellation fix data |
| `TXT` | Single-part and multipart receiver text |

GPS, GLONASS, Galileo, BeiDou, QZSS, and NavIC identifiers are normalized where the sentence provides enough information.

Every parsed record includes:

- `type`: the sentence identifier
- `raw`: the original sentence
- `valid`: whether the checksum matches

Blank optional numeric fields are represented as `null` rather than `NaN`.

## Geospatial Helpers

Coordinates use decimal degrees. Distances are returned in kilometers and headings use compass degrees, with north at `0` and east at `90`.

```javascript
const distance = GPS.Distance(48.8566, 2.3522, 51.5074, -0.1278);
const heading = GPS.Heading(48.8566, 2.3522, 51.5074, -0.1278);

const routeLength = GPS.TotalDistance([
  { lat: 48.8566, lon: 2.3522 },
  { lat: 50.1109, lon: 8.6821 },
  { lat: 51.5074, lon: -0.1278 }
]);
```

`Distance()` uses the haversine formula on a spherical Earth model. It is suitable for navigation estimates, not survey-grade ellipsoidal geodesy.

## Browser Usage

The browser IIFE exposes a global `GPS` constructor and also supports AMD loaders:

```html
<script src="https://unpkg.com/gps/dist/gps.min.js"></script>
<script>
  const gps = new GPS();
</script>
```

The browser ESM build is available through the `gps/browser` package export:

```javascript
import GPS from 'gps/browser';
```

Published artifacts are:

- `dist/gps.js`: CommonJS
- `dist/gps.mjs`: ES module
- `dist/gps.min.js`: minified browser IIFE with AMD support
- `dist/gps.min.mjs`: minified browser ES module

## Development

```bash
npm install
npm test
```

`npm test` runs strict TypeScript checking, builds every distribution, validates CommonJS and ESM type consumers, and executes the runtime and distribution suites.

## License

Copyright (c) 2026 [Robert Eisele](https://raw.org/)

Licensed under the MIT License.
