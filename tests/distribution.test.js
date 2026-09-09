'use strict';

const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { describe, it } = require('node:test');
const vm = require('node:vm');

describe('distribution', function () {
  it('exports a CommonJS class with aliases', function () {
    const GPS = require('../dist/gps.js');

    assert.equal(new GPS().state.processed, 0);
    assert.equal(GPS.default, GPS);
    assert.equal(GPS.GPS, GPS);
  });

  it('exports default and named ESM classes', async function () {
    const module = await import('../dist/gps.mjs');

    assert.equal(new module.default().state.processed, 0);
    assert.equal(module.GPS, module.default);
  });

  it('exports a browser global', async function () {
    const source = await readFile(path.join(__dirname, '../dist/gps.min.js'), 'utf8');
    const context = vm.createContext({ clearTimeout, setTimeout });
    vm.runInContext(source, context);

    assert.equal(new context.GPS().state.processed, 0);
  });

  it('registers with AMD loaders', async function () {
    const source = await readFile(path.join(__dirname, '../dist/gps.min.js'), 'utf8');
    let exported;
    const define = (dependencies, factory) => {
      assert.equal(Array.isArray(dependencies), true);
      assert.equal(dependencies.length, 0);
      exported = factory();
    };
    define.amd = {};
    vm.runInContext(source, vm.createContext({ clearTimeout, define, setTimeout }));

    assert.equal(new exported().state.processed, 0);
  });

  it('exports a browser ESM class', async function () {
    const module = await import('../dist/gps.min.mjs');

    assert.equal(new module.default().state.processed, 0);
    assert.equal(module.GPS, module.default);
  });
});
