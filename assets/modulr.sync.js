// modulr.sync.js (c) 2010 Tobie Langel
(function(exports) {
  var _factories = {},
      _modules = {},
      _requireStack = [],
      PREFIX = '__module__', // Poor man's hasOwnProperty
      RELATIVE_IDENTIFIER_PATTERN = /^\.\.?\//;
      
  function makeRequire(id, main) {
    // Find the requirer's dirname from it's id.
    var path = id.substring(0, id.lastIndexOf('/') + 1);
    
    function require(identifier) {
      var id = resolveIdentifier(identifier, path),
          key = PREFIX + id,
          mod = _modules[key],
          _requireStackIndex = -1;

      if ('indexOf' in _requireStack) {
        _requireStackIndex = _requireStack.indexOf(id);
      } else {
        // No indexOf support for Array
        for (var i = 0; i < _requireStack.length; i++) {
          if (_requireStack[i] === id) {
            _requireStackIndex = i;
            break;
          }
        }
      }
      if (_requireStackIndex !== -1) {
        var msg = 'Circular Require: ';
        var requireOrder = [];
        for (var i = _requireStackIndex; i < _requireStack.length; i++) {
          requireOrder.push(_requireStack[i]);
        }
        requireOrder.push(id);
        window.console && console.error(msg + requireOrder.join(' -> '));
      }
      _requireStack.push(id);

      // Check if this module's factory has already been called.
      if (!mod) {

        var fn = _factories[key];
        delete _factories[key]; // no longer needed.

        if (!fn) { throw 'Can\'t find module "' + identifier + '".'; }

        // lazy eval
        if (typeof fn === 'string') {
          fn = new Function('require', 'exports', 'module', fn);
        }

        _modules[key] = mod = { id: id, exports: {} };
        // Create an instance of `require` per module. Each instance has a
        // reference to the path it was called from to be able to properly
        // resolve relative identifiers.
        // `main` isn't defined until we actually require the program's
        // entry point.
        var r = makeRequire(id, main || mod);
        fn(r, mod.exports, mod);
      }

      _requireStack.pop();
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
    _factories[PREFIX + id] = factory;
  }
  
  exports.define = define;
  exports.require = makeRequire('');
})(this);
