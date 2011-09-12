var fs = require('fs'),
    path = require('path');

var RUNTIME_PATH = path.join(__dirname, '..', 'assets', 'modulr.sync.js'),
    JS_ESCAPE_REGEXP = /\\|\r?\n|"/g,
    INLINE_SCRIPT_SAFE_JS_ESCAPE_REGEXP = /\\|\r?\n|"|<\//g,
    JS_ESCAPE_MAP = {
       '\\': '\\\\',
       '\n': '\\n',
       '\r\n': '\\n',
       '"': '\\"',
       '</': '<\/'
     };

exports.createBuilder = createBuilder;
exports.create = createBuilder;
function createBuilder(config) {
  return new Builder(config);
}

exports.Builder = Builder;
function Builder(config) {
  this.lazyEval = config.lazyEval || false;
  this.inlineSafe = !!config.inlineSafe;
}

(function(p) {
  p.build = build;
  function build(result, callback) {
    var deps = result.dependencies,
        lazyEval = null,
        output = '';

    if (this.lazyEval === true) {
      // if lazy-eval is true, all modules are lazy-evaled.
      lazyEval = deps;
    } else if (this.lazyEval) {
      // Else `this.lazyEval` is an array of modules ids that
      // are to be lazy-evaled. Convert it to id/module object
      // pairs.
      var ids = this.lazyEval,
          modules = {};

      for (var i = 0; i < ids.length; i++) {
        var id = ids[i],
            module = deps[id];

        if (module) {
          modules[id] = module;
        } else {
          var err = new Error('lazyEval config option only accepts modules which are dependencies of "' + result.main + '". "' + id + '" is not.');
          callback(err);
          return;
        }
      }
      
      // Find their dependencies.
      lazyEval = this.findScopedDependencies(modules);
    }

    result.lazyEval = lazyEval;

    for (var id in deps) {
      if (lazyEval && (id in lazyEval)) {
        output += this.toLazyEvalTransport(deps[id]);
      } else {
        output += this.toTransport(deps[id]);
      }
    }

    if (result.main) {
      output += '\nrequire("' + result.main.id + '");';
    }
    
    fs.readFile(RUNTIME_PATH, 'utf8', function(err, file) {
      err ? callback(err) : callback(null, file + '\n' + output);
    });
  }
  
  p.toTransport = toTransport;
  function toTransport(module) {
    var output = '';
    output += '\ndefine("';
    output += module.id;
    output += '", function(require, exports, module) {\n';
    output += module.src;
    output += '\n});\n';
    return output;
  }

  p.toLazyEvalTransport = toLazyEvalTransport;
  function toLazyEvalTransport(module) {
    var output = '';
    output += '\ndefine("' + module.id + '", "';
    output += this.escape(module.src, this.inlineSafe);
    output += '");\n';
    return output;
  }

  p.findScopedDependencies = findScopedDependencies;
  function findScopedDependencies(modules) {
    var output = {};

    for (var id in modules) {
      var module = modules[id],
          deps = module.getDependencies();

      output[id] = module;
      for (var k in deps) { output[k] = deps[k]; }
    }

    // Loop over the collected modules. Eliminate those that were
    // not directly specified (i.e. not members of `modules`)
    // and which are required by modules which themselves aren't
    // members of `modules`.
    var modified = true;
    while (modified) {
      modified = false;
      for (var id in output) {
        var reqs = output[id].getRequirers();
        for (var k in reqs) {
          if (!(k in output) && !(id in modules)) {
            modified = true;
            delete output[id];
          }
        }
      }
    }

    return output;
  }

  p.escape = escape;
  function escape(str, inlineSafe) {
    var regexp = inlineSafe ? INLINE_SCRIPT_SAFE_JS_ESCAPE_REGEXP : JS_ESCAPE_REGEXP;
    return str.replace(regexp, function(m) {
      return JS_ESCAPE_MAP[m];
    });
  }
})(Builder.prototype);
