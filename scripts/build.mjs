import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

import { build } from 'esbuild';

const entryPoint = 'src/gps.ts';

await mkdir('dist', { recursive: true });

const shared = {
  bundle: true,
  entryPoints: [entryPoint],
  legalComments: 'inline',
  sourcemap: true,
  target: 'es2020',
};

await Promise.all([
  build({
    ...shared,
    format: 'esm',
    outfile: 'dist/gps.mjs',
  }),
  build({
    ...shared,
    footer: {
      js: [
        'const GPSExport = module.exports.default;',
        'Object.defineProperty(GPSExport, "__esModule", { value: true });',
        'GPSExport.default = GPSExport;',
        'GPSExport.GPS = GPSExport;',
        'module.exports = GPSExport;',
      ].join('\n'),
    },
    format: 'cjs',
    outfile: 'dist/gps.js',
    platform: 'node',
  }),
  build({
    ...shared,
    footer: {
      js: [
        'var GPSExport = GPSExports.default;',
        'if (typeof define === "function" && define.amd) define([], function () { return GPSExport; });',
        'else (typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this).GPS = GPSExport;',
      ].join('\n'),
    },
    format: 'iife',
    globalName: 'GPSExports',
    minify: true,
    outfile: 'dist/gps.min.js',
    sourcemap: false,
  }),
  build({
    ...shared,
    format: 'esm',
    minify: true,
    outfile: 'dist/gps.min.mjs',
    sourcemap: false,
  }),
]);

const declaration = await readFile('.types/gps.d.ts', 'utf8');
const typesDeclaration = await readFile('.types/types.d.ts', 'utf8');
await writeFile('dist/types.d.mts', typesDeclaration);
await writeFile(
  'dist/gps.d.mts',
  declaration.replaceAll("'./types'", "'./types.d.mts'"),
);
await writeFile('dist/gps.d.ts', [
  "import type { GPS as GPSConstructor } from './gps.d.mts';",
  '',
  'declare const GPS: typeof GPSConstructor;',
  '',
  'declare namespace GPS {',
  "  type FAAMode = import('./types.d.mts').FAAMode;",
  "  type GBS = import('./types.d.mts').GBS;",
  "  type GGA = import('./types.d.mts').GGA;",
  "  type GGAQuality = import('./types.d.mts').GGAQuality;",
  "  type GLL = import('./types.d.mts').GLL;",
  "  type GNS = import('./types.d.mts').GNS;",
  "  type GRS = import('./types.d.mts').GRS;",
  "  type GSA = import('./types.d.mts').GSA;",
  "  type GST = import('./types.d.mts').GST;",
  "  type GPSState = import('./types.d.mts').GPSState;",
  "  type GSV = import('./types.d.mts').GSV;",
  "  type HDT = import('./types.d.mts').HDT;",
  "  type LatLon = import('./types.d.mts').LatLon;",
  "  type NavigationStatus = import('./types.d.mts').NavigationStatus;",
  "  type NMEA = import('./types.d.mts').NMEA;",
  "  type NMEAByType = import('./types.d.mts').NMEAByType;",
  "  type GPSListener<T extends NMEA = NMEA> = import('./gps.d.mts').GPSListener<T>;",
  "  type RMC = import('./types.d.mts').RMC;",
  "  type Satellite = import('./types.d.mts').Satellite;",
  "  type TXT = import('./types.d.mts').TXT;",
  "  type VTG = import('./types.d.mts').VTG;",
  "  type ZDA = import('./types.d.mts').ZDA;",
  '}',
  '',
  'export = GPS;',
  '',
].join('\n'));
await copyFile('dist/types.d.mts', 'dist/types.d.ts');
await rm('.types', { recursive: true, force: true });
