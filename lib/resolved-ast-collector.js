var util = require('util'),
    abstractCollector = require('./abstract-collector'),
    SuperClass = require('./ast-collector').AstCollector,
    _super = SuperClass.prototype,
    uglify = require('uglify-js'),
    processor = uglify.uglify,
    parser = uglify.parser,
    walker = processor.ast_walker(),
    identifier = require('module-grapher/lib/identifier');

var RUNTIME = parser.parse(abstractCollector.getRuntimeSrcCode('modulr.sync.resolved.js'));

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
  p.getModuleId = getModuleId;
  function getModuleId(m) {
    return m.getHashCode();
  }

  p.renderRuntime = renderRuntime;
  function renderRuntime() {
    return RUNTIME;
  }

  p.getModuleAst = getModuleAst;
  function getModuleAst(m) {
    var modules = this.getModules(),
        self = this;
    function handleExpr(expr, args) {
      var firstArg = args[0];
      if (expr[0] == "name" && expr[1] == "require" && firstArg[0] == 'string') {
        var ident = identifier.create(firstArg[1]);
        ident = m.resolveIdentifier(ident);
        args = args.slice(0);
        var hash = self.getModuleId(modules[ident]);
        args[0] = ['string', hash];
        return [this[0], expr, args];
      }
    }

    return walker.with_walkers({
      "new": handleExpr,
      "call": handleExpr
    }, function() { return walker.walk(m.ast); });
  }
})(ResolvedAstCollector.prototype);
