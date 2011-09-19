var util = require('util'),
    SuperClass = require('./collector').Collector,
    _super = SuperClass.prototype,
    uglify = require('uglify-js'),
    processor = uglify.uglify,
    parser = uglify.parser,
    parse = parser.parse,
    walker = processor.ast_walker();

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
  p._main = null;
  p._modules = [];
  p._runtime = null;
  
  p.getSubtree = getSubtree;
  function getSubtree(m) {
    return m.ast[1];
  }

  p.addModule = addModule;
  function addModule(m) {
    var src = this.getSubtree(m),
        ast = [
      "call",
      ["name", "define"],
      [
        ["string", m.id],
        ["function", null, ["require", "exports", "module"], src]
      ]
    ];
    this._modules.push(ast);
  }  

  p.addLazyEvaledModule = addLazyEvaledModule;
  function addLazyEvaledModule(m) {
    var src = this.generateCode(m.ast),
        ast = ["call", ["name", "define"], [["string", m.id], ["string", src]]];
    this._modules.push(ast);
  }

  p.addMainModule = addMainModule;
  function addMainModule(m) {
    this._main = ["call", ["name", "require"], [["string", m.id]]];
  }

  p.addRuntime = addRuntime;
  function addRuntime(src) {
    this._runtime = parse(src);
  }

  p.toAST = toAST;
  function toAST() {
    var ast = parse(''),
        subTree = ast[1],
        modules = this._modules;
    
    subTree.push(this._runtime);
    
    // modules
    for (var i = 0, length = modules.length; i < length; i++) {
      subTree.push(modules[i]);
    }
    
    subTree.push(this._main);
    return ast;
  }

  p.generateCode = generateCode;
  function generateCode(ast) {
    return processor.gen_code(ast, {inline_script: this.inlineSafe});
  }

  p.toString = toString;
  function toString() {
    return this.generateCode(this.toAST());
  }
})(ASTCollector.prototype);

