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
     RUNTIME = abstractCollector.getRuntimeSrcCode('modulr.sync.js'),
     INDEX_TRIM_REGEXP = /(.*)\/index/;

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
    return Object.keys(constants).sort().map(function(k) {
      return 'var ' + k + ' = ' + JSON.stringify(constants[k]) + ';';
    }).join('\n');
  }

  p.makeDefine = makeDefine;
  function makeDefine(m, src) {
    var header = this.getCommentHeader(m),
        id = this.getModuleId(m);
    return header + 'define("' + id + '", ' + src + ');\n';
  }

  p.getCommentHeader = getCommentHeader;
  function getCommentHeader(m) {
    var output = '';
    output += '// module: ' + m.id + '\n';
    output += '// file:   ' + m.relativePath + '\n';
    return output;
  }

  p.defineModule = defineModule;
  function defineModule(m) {
    return this.makeDefine(m, 'function(require, exports, module) {\n' + this.getModuleSrc(m) +  '}');
  }

  p.defineLazyEvaluatedModule = defineLazyEvaluatedModule;
  function defineLazyEvaluatedModule(m) {
    var body = this.getModuleSrc(m) + this.getSourceUrl(m);
    return this.makeDefine(m, '"' + this.escape(body, this.config.inlineSafe) + '"');
  }

  p.getModuleSrc = getModuleSrc;
  function getModuleSrc(m) {
    if (m.duplicateOf) {
      return 'module.exports = require("' + this.getModuleId(m.duplicateOf) + '");'
    }
    return m.getSrc();
  }

  p.getSourceUrl = getSourceUrl;
  function getSourceUrl(m) {
    return '\n//@ sourceURL=' + m.relativePath.replace(INDEX_TRIM_REGEXP, '$1') + '\n';
  }

  p.getModuleId = getModuleId;
  function getModuleId(m) {
    return m.id;
  }

  p.beforeRequireCall = beforeRequireCall;
  function beforeRequireCall() {
    return 'if (__PERF__) { modulr.perf.defineEnd = modulr.perf.requireMainStart = Date.now(); }\n';
  }

  p.renderRequireCall = renderRequireCall;
  function renderRequireCall(m) {
    return 'require("' + this.getModuleId(m) + '");\n'
  }

  p.afterRequireCall = afterRequireCall;
  function afterRequireCall() {
    return 'if (__PERF__) { modulr.perf.requireMainEnd = modulr.perf.end = Date.now(); }\n';
  }

  p.renderRuntime = renderRuntime;
  function renderRuntime() {
    return RUNTIME + '\n';
  }
})(Collector.prototype);
