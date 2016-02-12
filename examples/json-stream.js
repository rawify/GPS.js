
// cat gps.out | node json-stream

var Transform = require('stream').Transform;

var GPS = require('../gps.js');

process.stdin.resume();
process.stdin.setEncoding('utf8');

function Process() {
  Transform.call(this, {objectMode: true});
}

Process.prototype = {
  _line: "",
  _transform: function(chunk, encoding, done) {

    var data = this._line + chunk.toString();

    var lines = data.split('\n');
    this._line = lines.splice(lines.length - 1, 1)[0];

    var self = this;

    lines.forEach(function(x) {

      var tmp = GPS.parse(x);
      if (tmp !== false) {
        self.push(JSON.stringify(tmp) + '\n');
      }
    });

    done();
  },
  _flush: function(done) {

    if (this._line) {
      var tmp = GPS.parse(this._line);
      this.push(JSON.stringify(tmp) + '\n');
    }
    this._line = "";
    done();
  }

};

var origProto = Process.prototype;
Process.prototype = Object.create(Transform.prototype);
for (var key in origProto) {
  Process.prototype[key] = origProto[key];
}
Process.prototype.constructor = Process;

process.stdin
        .pipe(new Process)
        .pipe(process.stdout);
