var fs = require('fs'),
    path = require('path');

var RUNTIME_PATH = path.join(__dirname, '..', 'assets', 'modulr.sync.js'),
    JS_ESCAPE_REGEXP = /\\|\r?\n|"/g,
    INLINE_SCRIPT_SAFE_JS_ESCAPE_REGEXP = /\\|\r?\n|"|<\//g,
    JS_ESCAPE_MAP = {
       '\\': '\\\\',
       '\n': '\\n',
       '\r\n': '\\n',
       '"': '\\"',
       '</': '<\/'
     };


exports.createBuilder = createBuilder;
exports.create = createBuilder;
function createBuilder(config) {
  return new Builder(config);
}

exports.Builder = Builder;
function Builder(config) {
  this.lazyEval = config.lazyEval || false;
  this.inlineSafe = !!config.inlineSafe;
}

(function(p) {
  p.build = build;
  function build(result, callback) {
    var deps = result.dependencies,
        output = '',
        lazyEval = this.lazyEval;

    output += Object.keys(deps).map(function(id) {
      // if lazy-eval is true, all modules are lazy-evaled.
      if (lazyEval === true) {
        return this.toLazyEvalTransport(deps[id]);
      }
      
      // Else lazyEval is an array of modules that are to be lazy-evaled.
      if (lazyEval && lazyEval.indexOf(id) > -1) {
        return this.toLazyEvalTransport(deps[id]);
      }
      
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

  p.toLazyEvalTransport = toLazyEvalTransport;
  function toLazyEvalTransport(module) {
    var output = '';
    output += '\ndefine("' + module.id + '", "';
    output += this.escape(module.src, this.inlineSafe);
    output += '");\n';
    return output;
  }

  p.escape = escape;
  function escape(str, inlineSafe) {
    var regexp = inlineSafe ? INLINE_SCRIPT_SAFE_JS_ESCAPE_REGEXP : JS_ESCAPE_REGEXP;
    return str.replace(regexp, function(m) {
      return JS_ESCAPE_MAP[m];
    });
  }
})(Builder.prototype);
