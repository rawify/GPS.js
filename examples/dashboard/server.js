'use strict';

const path = require('path');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const GPS = require('gps');

const SERIAL_PATH = '/dev/tty.usbmodem2101';
const SERIAL_BAUD = 4800;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html')); // rename saved client file to dashboard.html
});

function broadcast(obj) {
  const data = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  }
}

wss.on('connection', (ws) => {
  try { ws.send(JSON.stringify({ type: 'hello', payload: { ts: Date.now() } })); } catch { }
});

const port = new SerialPort({ path: SERIAL_PATH, baudRate: SERIAL_BAUD });
const parser = new ReadlineParser({ delimiter: '\r\n' });
port.pipe(parser);

const gps = new GPS();
gps.state.bearing = 0;
let prev = { lat: null, lon: null };

gps.on('data', function () {
  // compute bearing from previous fix to current fix (if available)
  if (prev.lat != null && prev.lon != null && gps.state.lat != null && gps.state.lon != null) {
    gps.state.bearing = GPS.Heading(prev.lat, prev.lon, gps.state.lat, gps.state.lon);
  }
  prev.lat = gps.state.lat;
  prev.lon = gps.state.lon;

  broadcast({ type: 'state', payload: gps.state });
});

parser.on('data', function (line) {
  try { gps.update(line); } catch (e) { /* errors counted in gps.state.errors */ }
});

// ---------- Logs ----------
port.on('open', () => console.log(`[serial] open ${SERIAL_PATH} @ ${SERIAL_BAUD}`));
port.on('error', (err) => console.error('[serial] error', err));
wss.on('listening', () => console.log('[ws] listening on /ws'));
server.listen(3000, () => console.log(`listening on http://localhost:3000`));
