var JS_ESCAPE_REGEXP = /\\|\r?\n|"/g,
    INLINE_SCRIPT_SAFE_JS_ESCAPE_REGEXP = /\\|\r?\n|"|<\//g,
    JS_ESCAPE_MAP = {
       '\\': '\\\\',
       '\n': '\\n',
       '\r\n': '\\n',
       '"': '\\"',
       '</': '<\/'
     };

exports.createCollector = createCollector;
exports.create = createCollector;
function createCollector(config) {
  return new Collector(config);
}

exports.Collector = Collector;
function Collector(config) {
  this.inlineSafe = !!config.inlineSafe;
}

(function(p) {
  p._main = '';
  p._output = '';
  p._runtime = '';
  
  p.addModule = addModule;
  function addModule(m) {
    var src = 'function(require, exports, module) {\n' + m.src +  '\n}';
    this._output += this.makeDefine(m.id, src);
    
  }

  p.addLazyEvaledModule = addLazyEvaledModule;
  function addLazyEvaledModule(m) {
    var src = this.escape(m.src, this.inlineSafe);
    this._output += this.makeDefine(m.id, '"' + src + '"');
  }

  p.makeDefine = makeDefine;
  function makeDefine(id, src) {
    return '\ndefine("' + id + '", ' + src + ');\n';
  }

  p.addMainModule = addMainModule;
  function addMainModule(m) {
    this._main = '\nrequire("' + m.id + '");\n';
  }

  p.addRuntime = addRuntime;
  function addRuntime(src) {
    this._runtime = src + '\n';
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
    return this._runtime + this._output + this._main;
  }
})(Collector.prototype);

