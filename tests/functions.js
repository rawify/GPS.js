
const GPS = require('gps');
const assert = require('assert');

describe('GPS functions', function () {

  it('should measure distance', function () {

    var result = GPS.Distance(45.527517, -122.718766, 45.373373, -121.693604);

    assert.deepEqual(result, 81.80760861833895)
  });

  it('should measure heading', function () {

    var result = GPS.Heading(45.527517, -122.718766, 45.373373, -121.693604);

    assert.deepEqual(result, 101.73177498132071)
  });

});