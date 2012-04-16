var DEV = 'dev',
    PROD = 'prod';


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

    this.setDevConstant(clonedConsts);
    this.setPerfConstant(clonedConsts);

    result.lazyEval = lazyEval;
    collector.setLazyEvaluatedModules(lazyEval);
    collector.setModules(deps);
    collector.addMainModule(result.main);
    collector.setConstants(clonedConsts);
    return collector.toString();
  }

  p.setDevConstant = setDevConstant;
  function setDevConstant(constants) {
    var env = this.getEnv(),
        isDev = env === DEV;

    if (env === null) { return; }

    if ('__DEV__' in constants && constants.__DEV__ !== isDev) {
      var msg = 'Contradictory __DEV__ constant (' + JSON.stringify(constants.__DEV__) + ') ';
      msg += 'and config.environment (' + JSON.stringify(this.config.environment) + ') values.\n'
      msg += 'When using config.environment, avoid also setting __DEV__ constants.'
      throw new Error(msg);
    }

    constants.__DEV__ = isDev;
  }

  p.setPerfConstant = setPerfConstant;
  function setPerfConstant(constants) {
    constants.__PERF__ = this.config.instrumentPerformance ? true : false;
  }

  p.getEnv = function() {
    var config = this.config,
        env = config.environment;

    if (!('environment' in config)) {
      return null;
    }

    switch (env) {
      case DEV:
      case '__DEV__':
      case 'development':
        return DEV;
        break;
      case PROD:
      case '__PROD__':
      case 'production':
        return PROD;
        break;
      default:
        throw new TypeError('Unsupported environment: ' + env);
    }
  }

  p.createCollector = createCollector;
  function createCollector(config) {
    var collector;
    if (config.minify) {
      collector = config.resolveIdentifiers ? './resolved-ast-collector' : './ast-collector';
    } else if (this.getEnv() === DEV) {
      collector = './dev-collector';
    } else {
      collector = './collector';
    }
    return require(collector).create(config);
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
