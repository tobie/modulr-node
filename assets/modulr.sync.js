// modulr.sync.js (c) 2010 Tobie Langel
(function(exports) {
  var _factories = {},
      _modules = {},
      _handlers = [],
      _dirStack = [''],
      PREFIX = '__module__', // Poor man's hasOwnProperty
      RELATIVE_IDENTIFIER_PATTERN = /^\.\.?\//;
  
  function require(identifier) {
    var id = resolveIdentifier(identifier),
        key = PREFIX + id,
        mod = _modules[key];
    
    if (mod) { return mod.exports };
    
    _modules[key] = mod = {
      id: id,
      exports: {}
    };
    
    _dirStack.push(id.substring(0, id.lastIndexOf('/') + 1))
    try {
      var fn = _factories[key];
      if (!fn) { throw 'Can\'t find module "' + identifier + '".'; }
      
      // lazy eval
      if (typeof fn === 'string') {
        fn = new Function('require', 'exports', 'module', fn);
      }
      // require.main isn't defined until we actually require the program's
      // entry point.
      if (!require.main) { require.main = mod; }
      fn(require, mod.exports, mod);
      _dirStack.pop();
    } catch(e) {
      _dirStack.pop();
      // We'd use a finally statement here if it wasn't for IE.
      throw e;
    }
    
    return mod.exports;
  }
  
  function resolveIdentifier(identifier) {
    var dir, parts, part, path;
    
    if (!RELATIVE_IDENTIFIER_PATTERN.test(identifier)) {
      return identifier;
    }
    dir = _dirStack[_dirStack.length - 1];
    parts = (dir + identifier).split('/');
    path = [];
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      switch (part) {
        case '':
        case '.':
          continue;
        case '..':
          path.pop();
          break;
        default:
          path.push(part);
      }
    }
    return path.join('/');
  }
  
  function define(id, factory) {
    _factories[PREFIX + id] = factory;
  }
  
  exports.define = define;
  exports.require = require;
})(this);