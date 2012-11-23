var util = require('util'),
    astCollector = require('./ast-collector'),
    SuperClass = astCollector.AstCollector,
    _super = SuperClass.prototype,
    uglify = require('uglify-js'),
    walker = uglify.uglify.ast_walker(),
    identifier = require('module-grapher/lib/identifier');

var uniqueId = 0;
var map = {};
function generateId(id) {
  return (map[id] ? map[id] : (map[id] = (uniqueId++).toString(36)));
}

var RUNTIME = astCollector.getRuntimeAst('modulr.sync.resolved.js');

exports.createResolvedAstCollector = createResolvedAstCollector;
exports.create = createResolvedAstCollector;
function createResolvedAstCollector(config) {
  return new ResolvedAstCollector(config);
}

exports.ResolvedAstCollector = ResolvedAstCollector;
function ResolvedAstCollector(config) {
  SuperClass.call(this, config);
}

util.inherits(ResolvedAstCollector, SuperClass);

(function(p) {
  p.setModules = setModules;
  function setModules(modules) {
    var m, _modules = {};
    for (var id in modules) {
      m = modules[id];
      if (!m.duplicateOf) {
        _modules[id] = m;
      }
    }
    // do not export module aliases
    this._modules = _modules;
    // use them only while resolving
    this._modulesWithDuplicates = modules;
  }

  p.getModuleIdAst = getModuleIdAst;
  function getModuleIdAst(m) {
    if (this.config.minify) {
      var moduleId = m.getHashCode();
      if (this.config.minifyIdentifiers) {
        moduleId = generateId(moduleId);
      }
      return ["string", moduleId];
    } else {
      while (m.duplicateOf) {
        m = m.duplicateOf;
      }
      return ["string", m.id];
    }
  }

  p.renderRuntime = renderRuntime;
  function renderRuntime() {
    return RUNTIME;
  }

  p.getModuleAst = getModuleAst;
  function getModuleAst(m) {
    var modules = this._modulesWithDuplicates,
        self = this;
    function handleExpr(expr, args) {
      var firstArg = args[0];
      if (expr[0] == "name" && expr[1] == "require" && firstArg[0] == 'string') {
        var ident = identifier.create(firstArg[1]);
        ident = m.resolveIdentifier(ident);
        args = args.slice(0);
        args[0] = self.getModuleIdAst(modules[ident]);
        return [this[0], expr, args];
      }
    }

    return walker.with_walkers({
      "new": handleExpr,
      "call": handleExpr
    }, function() { return walker.walk(m.ast); });
  }
})(ResolvedAstCollector.prototype);
