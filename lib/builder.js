var fs = require('fs'),
    path = require('path');

var RUNTIME_PATH = path.join(__dirname, '..', 'assets', 'modulr.sync.js');

exports.createBuilder = createBuilder;
exports.create = createBuilder;
function createBuilder(config) {
  return new Builder(config);
}

exports.Builder = Builder;
function Builder(config) {
  this.lazyEval = config.lazyEval || false;
  this.inlineSafe = !!config.inlineSafe;
  this.config = config;
}

(function(p) {
  p.build = build;
  function build(result, callback) {
    var deps = result.dependencies,
        lazyEval = null,
        collector = this.createCollector(this.config);

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
        collector.addLazyEvaledModule(deps[id]);
      } else {
        collector.addModule(deps[id]);
      }
    }

    if (result.main) {
      collector.addMainModule(result.main);
    }
    
    fs.readFile(RUNTIME_PATH, 'utf8', function(err, src) {
      if (err) {
        callback(err);
      } else {
        collector.addRuntime(src);
        result.output = collector.toString();
        callback(null, result);
      }
    });
  }
  
  p.createCollector = createCollector;
  function createCollector(config) {
    return require('./ast-collector').create(config);
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
})(Builder.prototype);
