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
  this.output = '';
}

(function(p) {
  p.main = '';
  p.runtime = '';
  
  p.addModule = addModule;
  function addModule(m) {
    this.output += '\ndefine("';
    this.output += m.id;
    this.output += '", function(require, exports, module) {\n';
    this.output += m.src;
    this.output += '\n});\n';
  }

  p.addLazyEvaledModule = addLazyEvaledModule;
  function addLazyEvaledModule(m) {
    this.output += '\ndefine("' + m.id + '", "';
    this.output += this.escape(m.src, this.inlineSafe);
    this.output += '");\n';
  }
  
  p.addMainModule = addMainModule;
  function addMainModule(m) {
    this.main = '\nrequire("' + m.id + '");\n';
  }
  
  p.addRuntime = addRuntime;
  function addRuntime(src) {
    this.runtime = src + '\n';
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
    return this.runtime + this.output + this.main;
  }
})(Collector.prototype);

