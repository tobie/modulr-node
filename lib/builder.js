exports.createBuilder = createBuilder;
exports.create = createBuilder;
function createBuilder(config) {
  return new Builder(config);
}

exports.Builder = Builder;
function Builder(config) {
  this.config = config;
}

(function(p) {
  p.build = build;
  function build(result) {
    var deps = result.dependencies,
        lazyEval = null,
        collector = this.createCollector(this.config);

    if (this.config.lazyEval === true) {
      // if lazy-eval is true, all modules are lazy-evaled.
      lazyEval = deps;
    } else if (this.config.lazyEval) {
      // Else `this.config.lazyEval` is an array of modules ids that
      // are to be lazy-evaled. Convert it to id/module object
      // pairs.
      var ids = this.config.lazyEval,
          modules = {};

      for (var i = 0; i < ids.length; i++) {
        var id = ids[i],
            module = deps[id];

        if (module) {
          modules[id] = module;
        } else {
          var msg = 'LazyEval config option only accepts modules which are dependencies of "';
          msg += result.main + '". "' + id + '" is not.';
          throw new TypeError(msg);
        }
      }
      
      // Find their dependencies.
      lazyEval = this.findScopedDependencies(modules);
    }

    // Clone constants
    var constants = this.config.constants,
        clonedConsts = {};

    for (var k in constants) {
      clonedConsts[k] = constants[k];
    }

    this.setDevConstant(clonedConsts, this.config.environment);

    result.lazyEval = lazyEval;
    collector.setLazyEvaluatedModules(lazyEval);
    collector.setModules(deps);
    collector.addMainModule(result.main);
    collector.setConstants(clonedConsts);
    return collector.toString();
  }

  p.setDevConstant = setDevConstant;
  function setDevConstant(constants, env) {
    var isDev;

    if (typeof env !== 'string') {
      return;
    }

    switch (env) {
      case 'dev':
      case '__DEV__':
      case 'development':
        isDev = true;
        break;
      case 'prod':
      case '__PROD__':
      case 'production':
        isDev = false;
        break;
      default:
        throw new TypeError('Unsupported environment: ' + env);
    }

    if (constants && '__DEV__' in constants && constants.__DEV__ !== isDev) {
      var msg = 'Contradictory __DEV__ constant (' + JSON.stringify(constants.__DEV__) + ') ';
      msg += 'and config.environment (' + JSON.stringify(env) + ') values.\n'
      msg += 'When using config.environment, avoid also setting __DEV__ constants.'
      throw new Error(msg);
    }

    constants.__DEV__ = isDev;
  }

  p.createCollector = createCollector;
  function createCollector(config) {
    if (config.minify) {
      if (config.resolveIdentifiers) {
        return require('./resolved-ast-collector').create(config);
      } else {
        return require('./ast-collector').create(config);
      }
    } else {
      return require('./collector').create(config);
    }
  }

  p.findScopedDependencies = findScopedDependencies;
  function findScopedDependencies(modules) {
    var output = {};

    // Collect all the modules which are selected for
    // lazy evaluation along with their dependencies.
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
