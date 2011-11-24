var fs = require('fs'),
    path = require('path');

var JS_ESCAPE_REGEXP = /\\|\r?\n|"/g,
    INLINE_SCRIPT_SAFE_JS_ESCAPE_REGEXP = /\\|\r?\n|"|<\//g,
    JS_ESCAPE_MAP = {
       '\\': '\\\\',
       '\n': '\\n',
       '\r\n': '\\n',
       '"': '\\"',
       '</': '<\/'
     },
     RUNTIME_PATH = path.join(__dirname, '..', 'assets', 'modulr.sync.js'),
     RUNTIME = fs.readFileSync(RUNTIME_PATH, 'utf8');

exports.RUNTIME = RUNTIME;
exports.createCollector = createCollector;
exports.create = createCollector;
function createCollector(config) {
  return new Collector(config);
}

exports.Collector = Collector;
function Collector(config) {
  this.config = config;
  this._modules = [];
  this._lazyEvaledModules = [];
}

(function(p) {
  p._main = null;
  p._modules = null;
  p._lazyEvaledModules = null;
  p._runtime = null;
  
  p.addModule = addModule;
  function addModule(m) {
    this._modules.push(m);
  }

  p.addLazyEvaledModule = addLazyEvaledModule;
  function addLazyEvaledModule(m) {
    this._lazyEvaledModules.push(m);
  }

  p.makeDefine = makeDefine;
  function makeDefine(id, src) {
    return '\ndefine("' + id + '", ' + src + ');';
  }

  p.addMainModule = addMainModule;
  function addMainModule(m) {
    this._main = m;
  }

  p.escape = escape;
  function escape(str, inlineSafe) {
    var regexp = inlineSafe ? INLINE_SCRIPT_SAFE_JS_ESCAPE_REGEXP : JS_ESCAPE_REGEXP;
    return str.replace(regexp, function(m) {
      return JS_ESCAPE_MAP[m];
    });
  }

  p.toString = toString;
  function toString() {
    var output = [];

    output.push(RUNTIME);

    this._modules.forEach(function(m) {
      var src = 'function(require, exports, module) {\n' + m.src +  '\n}';
      output.push(this.makeDefine(m, src));
    }, this);

    this._lazyEvaledModules.forEach(function(m) {
      var src = this.escape(m.src, this.config.inlineSafe);
      output.push(this.makeDefine(m, '"' + src + '"'));
    }, this);

    output.push('require("' + this._main.id + '");');

    return output.join('\n');
  }
})(Collector.prototype);

