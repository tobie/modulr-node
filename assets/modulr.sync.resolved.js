// modulr.sync.js (c) 2010 Tobie Langel
(function(exports) {
  var _factories = {},
      _modules = {},
      PREFIX = '__module__'; // Poor man's hasOwnProperty
  
  function require(id) {
    var key = PREFIX + id,
        mod = _modules[key];
    
    if (mod) { return mod.exports; }
    
    _modules[key] = mod = {
      id: id,
      exports: {}
    };
    
    var fn = _factories[key];
    delete _factories[key];
    
    if (!fn) { throw 'Can\'t find module "' + id + '".'; }

    // lazy eval
    if (typeof fn === 'string') {
      fn = new Function('require', 'exports', 'module', fn);
    }
    // require.main isn't defined until we actually require the program's
    // entry point.
    if (!require.main) { require.main = mod; }
    fn(require, mod.exports, mod);
    return mod.exports;
  }

  function define(id, factory) {
    _factories[PREFIX + id] = factory;
  }
  
  exports.define = define;
  exports.require = require;
})(this);