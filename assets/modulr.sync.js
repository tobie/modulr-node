// modulr.sync.js (c) 2010 Tobie Langel
(function(exports) {
  var modulr = {},
      _factories = {},
      _modules = {},
      PREFIX = '__module__', // Poor man's hasOwnProperty
      RELATIVE_IDENTIFIER_PATTERN = /^\.\.?\//;

  if (__PERF__) {
    var _perf = modulr.perf = {
      start: Date.now(),
      modules: {}
    },
    _pos = 1;
  }

  function makeRequire(id, main) {
    // Find the requirer's dirname from it's id.
    var path = id.substring(0, id.lastIndexOf('/') + 1);

    function require(identifier) {
      if (__PERF__) { var t0 = Date.now(); }
      var id = resolveIdentifier(identifier, path),
          key = PREFIX + id,
          mod = _modules[key];

      if (__PERF__) {
        var _p = _perf.modules[id];
        _p.count++;
      }
      // Check if this module's factory has already been called.
      if (!mod) {
        if (__PERF__) {
          _p.left = _pos++;
          _p.start = t0;
        }
        var fn = _factories[key];
        delete _factories[key]; // no longer needed.

        if (!fn) { throw 'Can\'t find module "' + identifier + '".'; }

        // lazy eval
        if (typeof fn === 'string') {
          if (__PERF__) { _p.evalStart = Date.now(); }
          fn = new Function('require', 'exports', 'module', fn);
          if (__PERF__) { _p.evalEnd = Date.now(); }
        }

        _modules[key] = mod = { id: id, exports: {} };
        // Create an instance of `require` per module. Each instance has a
        // reference to the path it was called from to be able to properly
        // resolve relative identifiers.
        // `main` isn't defined until we actually require the program's
        // entry point.
        var r = makeRequire(id, main || mod);
        fn(r, mod.exports, mod);
        if (__PERF__) {
          _p.right = _pos++;
          _p.end = Date.now();
        }
      }
      return mod.exports;
    }

    require.main = main;
    return require;
  }

  function resolveIdentifier(identifier, dir) {
    var parts, part, path;
    
    if (!RELATIVE_IDENTIFIER_PATTERN.test(identifier)) {
      return identifier;
    }

    parts = (dir + identifier).split('/');

    path = [];
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      switch (part) {
        case '':
        case '.':
          continue;
        case '..':
          if (path.length) {
            path.pop();
          } else {
            throw new RangeError('Out of bounds identifier: ' + identifier);
          }
          break;
        default:
          path.push(part);
      }
    }
    return path.join('/');
  }
  
  function define(id, factory) {
    if (__PERF__) { _perf.modules[id] = { count: 0 }; }
    _factories[PREFIX + id] = factory;
  }
  
  exports.define = define;
  exports.require = makeRequire('');
  exports.modulr = modulr;
})(this);

if (__PERF__) { modulr.perf.defineStart = Date.now(); }
