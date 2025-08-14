
const path = require('path');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const GPS = require('gps');
const Sylvester = require('sylvester');
const Kalman = require('kalman').KF;

// Serial device (adjust to your platform)
const SERIAL_PATH = '/dev/tty.usbmodem2101';
const SERIAL_BAUD = 4800;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Static assets
app.use(express.static(__dirname));

app.get('/', (req, res, next) => {
  const file = path.join(__dirname, 'maps.html');
  return res.sendFile(file);
});

// WS helpers
function broadcast(obj) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

wss.on('connection', (ws) => {
  try {
    ws.send(JSON.stringify({ type: 'hello', payload: { ts: Date.now() } }));
  } catch { }
});

const port = new SerialPort({ path: SERIAL_PATH, baudRate: SERIAL_BAUD });
const parser = new ReadlineParser({ delimiter: '\r\n' });
port.pipe(parser);

const gps = new GPS();

// Simple 2D Kalman (lat, lon)
const A = Sylvester.Matrix.I(2);
const B = Sylvester.Matrix.Zero(2, 2);
const H = Sylvester.Matrix.I(2);
const C = Sylvester.Matrix.I(2);

// Tune Q/R for your receiver (these are conservative defaults)
const Q = Sylvester.Matrix.I(2).multiply(1e-11);
const R = Sylvester.Matrix.I(2).multiply(1e-5);

const u = Sylvester.Vector.create([0, 0]);
const filter = new Kalman(Sylvester.Vector.create([0, 0]), Sylvester.Matrix.create([[1, 0], [0, 1]]));

gps.on('data', function (data) {
  if (data.lat != null && data.lon != null) {
    filter.update({
      A, B, C, H, R, Q, u,
      y: Sylvester.Vector.create([data.lat, data.lon])
    });

    // Attach filtered position + covariance to state
    gps.state.position = {
      pos: filter.x.elements,     // [lat, lon]
      cov: filter.P.elements      // [[..],[..]]
    };
  }

  broadcast({ type: 'position', payload: gps.state });
});

// Feed NMEA from serial into gps.js
parser.on('data', (line) => {
  try { gps.update(line); } catch (e) { /* count is inside gps.state.errors */ }
});

// Basic lifecycle logs
port.on('open', () => console.log(`[serial] open ${SERIAL_PATH} @ ${SERIAL_BAUD}`));
port.on('error', (err) => console.error('[serial] error', err));
wss.on('listening', () => console.log('[ws] listening on /ws'));

server.listen(3000, () => console.log(`listening on http://localhost:3000`));
