// modulr.sync.js (c) 2010 Tobie Langel
(function(exports) {
  var modulr = {},
      _factories = {},
      _modules = {},
      PREFIX = '__module__'; // Poor man's hasOwnProperty

  if (__PERF__) {
    var _perf = modulr.perf = {
      start: Date.now(),
      modules: {}
    };
  }

  function require(id) {
    var key = PREFIX + id,
        mod = _modules[key];

    if (__PERF__) {
      var _p = _perf.modules[id] = _perf.modules[id] || {
        count: 0,
        start: Date.now()
      };
      _p.count++;
    }

    if (mod) { return mod.exports; }

    var fn = _factories[key];
    delete _factories[key];

    if (!fn) { throw 'Can\'t find module "' + id + '".'; }

    // lazy eval
    if (typeof fn === 'string') {
      if (__PERF__) { _p.evalStart = Date.now(); }
      fn = new Function('require', 'exports', 'module', fn);
      if (__PERF__) { _p.evalEnd = Date.now(); }
    }

    _modules[key] = mod = { id: id, exports: {} };
    // require.main isn't defined until we actually require the program's
    // entry point.
    if (!require.main) { require.main = mod; }
    fn(require, mod.exports, mod);
    if (__PERF__) { _p.end = Date.now(); }
    return mod.exports;
  }

  function define(id, factory) {
    _factories[PREFIX + id] = factory;
  }

  exports.define = define;
  exports.require = require;
  exports.modulr = modulr;
})(this);

if (__PERF__) { modulr.perf.defineStart = Date.now(); }
