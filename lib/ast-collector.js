var util = require('util'),
    SuperClass = require('./collector').Collector,
    _super = SuperClass.prototype,
    uglify = require('uglify-js'),
    processor = uglify.uglify,
    parser = uglify.parser,
    parse = parser.parse,
    walker = processor.ast_walker(),
    identifier = require('module-grapher/lib/identifier');

exports.createASTCollector = createASTCollector;
exports.create = createASTCollector;
function createASTCollector(config) {
  return new ASTCollector(config);
}

exports.ASTCollector = ASTCollector;
function ASTCollector(config) {
  SuperClass.call(this, config);
}

util.inherits(ASTCollector, SuperClass);

(function(p) {

  p.getModuleSubtree = getModuleSubtree;
  function getModuleSubtree(m) {
    var ast = this.config.resolveIdentifiers ? this.getResolvedAST(m) : m.ast,
        subtree = ast[1];
    subtree = ["function", null, ["require", "exports", "module"], subtree];
    return this.makeDefine(m.id, subtree);
  }

  p.getLazyEvaledModuleSubtree = getLazyEvaledModuleSubtree;
  function getLazyEvaledModuleSubtree(m) {
    var ast = this.config.resolveIdentifiers ? this.getResolvedAST(m) : m.ast,
        src = this.generateCode(ast);
    return this.makeDefine(m.id, ["string", src]);
  }

  p.makeDefine = makeDefine;
  function makeDefine(id, subtree) {
    return ["call", ["name", "define"], [["string", id], subtree]];
  }

  p.getMainModuleSubtree = getMainModuleSubtree;
  function getMainModuleSubtree() {
    return ["call", ["name", "require"], [["string", this._main.id]]];
  }

  p.getRuntimeAST = getRuntimeAST;
  function getRuntimeAST() {
    return parse(this._runtime);
  }

  p.toAST = toAST;
  function toAST() {
    var ast = parse(''),
        subTree = ast[1];

    subTree.push(this.getRuntimeAST());

    this._modules.forEach(function(m) {
      subTree.push(this.getModuleSubtree(m));
    }, this);

    this._lazyEvaledModules.map(function(m) {
      subTree.push(this.getLazyEvaledModuleSubtree(m));
    }, this);

    subTree.push(this.getMainModuleSubtree());
    return ast;
  }

  p.generateCode = generateCode;
  function generateCode(ast) {
    return processor.gen_code(ast, {inline_script: this.config.inlineSafe});
  }

  p.getResolvedAST = getResolvedAST;
  function getResolvedAST(m) {
    function handleExpr(expr, args) {
      var firstArg = args[0];
      if (expr[0] == "name" && expr[1] == "require" && firstArg[0] == 'string') {
        var ident = identifier.create(firstArg[1]);
        ident = ident.resolve(m.identifier);
        args = args.slice(0);
        args[0] = ['string', ident.toString()];
        return [this[0], expr, args];
      }
    }

    return walker.with_walkers({
      "new": handleExpr,
      "call": handleExpr
    }, function() { return  walker.walk(m.ast); });
  }

  p.toString = toString;
  function toString() {
    return this.generateCode(this.toAST());
  }
})(ASTCollector.prototype);

