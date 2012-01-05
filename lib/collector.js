var util = require('util'),
    abstractCollector = require('./abstract-collector'),
    SuperClass = abstractCollector.AbstractCollector,
    _super = SuperClass.prototype;

var JS_ESCAPE_REGEXP = /\\|\r?\n|"/g,
    INLINE_SCRIPT_SAFE_JS_ESCAPE_REGEXP = /\\|\r?\n|"|<\//g,
    JS_ESCAPE_MAP = {
       '\\': '\\\\',
       '\n': '\\n',
       '\r\n': '\\n',
       '"': '\\"',
       '</': '<\/'
     },
     RUNTIME = abstractCollector.getRuntimeSrcCode('modulr.sync.js');

exports.createCollector = createCollector;
exports.create = createCollector;
function createCollector(config) {
  return new Collector(config);
}

exports.Collector = Collector;
function Collector(config) {
  SuperClass.call(this, config);
}

util.inherits(Collector, SuperClass);

(function(p) {
  p.makeDefine = makeDefine;
  function makeDefine(m, src) {
    var output = '';
    output += '\n// module: ' + m.id;
    output += '\n// file:   ' + m.relativePath;
    output += '\ndefine("' + m.id + '", ' + src + ');';
    return output;
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
    var buffer = [];
    this.render(buffer);
    return buffer.join('\n');
  }

  p.render = render;
  function render(buffer) {
    var constants = this.renderConstants();
    if (constants) { buffer.push(constants); }
    return SuperClass.prototype.render.call(this, buffer);
  }

  p.renderConstants = renderConstants;
  function renderConstants() {
    var constants = this.getConstants();
    return Object.keys(constants).map(function(k) {
      return 'var ' + k + ' = ' + constants[k] + ';';
    }).join('\n');
  }

  p.encloseModule = encloseModule;
  function encloseModule(m) {
    return 'function(require, exports, module) {\n' + this.getModuleSrc(m) +  '\n}';
  }

  p.escapeModule = escapeModule;
  function escapeModule(m) {
    var body = this.getModuleSrc(m) + '\n//@ sourceURL=' + m.relativePath;
    return '"' + this.escape(body, this.config.inlineSafe) + '"';
  }

  p.getModuleSrc = getModuleSrc;
  function getModuleSrc(m) {
    if (m.duplicateOf) {
      return 'module.exports = require("' + this.getModuleId(m.duplicateOf) + '");'
    }
    return m.getSrc();
  }

  p.getModuleId = getModuleId;
  function getModuleId(m) {
    return m.id;
  }

  p.renderRequireCall = renderRequireCall;
  function renderRequireCall(m) {
    return 'require("' + this.getModuleId(m) + '");'
  }

  p.renderRuntime = renderRuntime;
  function renderRuntime() {
    return RUNTIME;
  }
})(Collector.prototype);

