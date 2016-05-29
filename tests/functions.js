
var expect = require('chai').expect;
var GPS = require('../gps.js');

describe('GPS functions', function() {

  it('should measure distance', function() {

    var result = GPS.Distance(45.527517, -122.718766, 45.373373, -121.693604);

    expect(result).to.deep.equal(81.80760861833895);

  });

  it('should measure heading', function() {

    var result = GPS.Heading(45.527517, -122.718766, 45.373373, -121.693604);

    expect(result).to.deep.equal(101.73177498132071);

  });

});