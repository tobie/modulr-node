var fs = require('fs'),
    path = require('path');

var RUNTIME_PATH = path.join(__dirname, '..', 'assets', 'modulr.sync.js');

exports.createBuilder = createBuilder;
exports.create = createBuilder;
function createBuilder(config) {
  return new Builder(config);
}

exports.Builder = Builder;
function Builder(config) {
}

(function(p) {
  p.build = build;
  function build(result, callback) {
    var deps = result.dependencies,
        output = '';

    output += Object.keys(deps).map(function(id) {
      return this.toTransport(deps[id]);
    }, this).join('');

    if (result.main) {
      output += '\nrequire("' + result.main.id + '");';
    }
    
    fs.readFile(RUNTIME_PATH, 'utf8', function(err, file) {
      err ? callback(err) : callback(null, file + '\n' + output);
    });
  }
  
  p.toTransport = toTransport;
  function toTransport(module) {
    var output = '';
    output += '\ndefine("';
    output += module.id;
    output += '", function(require, exports, module) {\n';
    output += module.src;
    output += '\n});\n';
    return output;
  }
})(Builder.prototype);
