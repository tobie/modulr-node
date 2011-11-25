var util = require('util'),
    abstractCollector = require('./abstract-collector'),
    SuperClass = abstractCollector.AbstractCollector,
    _super = SuperClass.prototype,
    uglify = require('uglify-js'),
    processor = uglify.uglify,
    parser = uglify.parser;

var RUNTIME = parser.parse(abstractCollector.getRuntimeSrcCode('modulr.sync.js'));

exports.createAstCollector = createAstCollector;
exports.create = createAstCollector;
function createAstCollector(config) {
  return new AstCollector(config);
}

exports.AstCollector = AstCollector;
function AstCollector(config) {
  SuperClass.call(this, config);
}

util.inherits(AstCollector, SuperClass);

(function(p) {
  p.getModuleId = getModuleId;
  function getModuleId(m) {
    return m.id;
  }

  p.encloseModule = encloseModule;
  function encloseModule(m) {
    var ast = this.getModuleAst(m);
    return ["function", null, ["require", "exports", "module"], this.getSubtree(ast)];
  }

  p.escapeModule = escapeModule;
  function escapeModule(m) {
    var ast = this.getModuleAst(m);
    return ["string", this.generateCode(ast)];
  }

  p.makeDefine = makeDefine;
  function makeDefine(m, subtree) {
    return ["call", ["name", "define"], [["string", this.getModuleId(m)], subtree]];
  }

  p.renderRequireCall = renderRequireCall;
  function renderRequireCall(m) {
    return ["call", ["name", "require"], [["string", this.getModuleId(m)]]];
  }

  p.renderRuntime = renderRuntime;
  function renderRuntime() {
    return RUNTIME;
  }

  p.generateCode = generateCode;
  function generateCode(ast) {
    return processor.gen_code(ast, { inline_script: this.config.inlineSafe });
  }

  p.getModuleAst = getModuleAst;
  function getModuleAst(m) {
    var ast;
    if (m.duplicateOf) {
      ast = ["toplevel",
        [
          ["stat",
            ["assign", true,
              ["dot", ["name", "module"], "exports"],
              ["call", ["name", "require"], [["string", this.getModuleId(m.duplicateOf)]]]
            ]
          ]
        ]
      ];
    } else {
      ast = m.ast;
    }
    return ast;
  }

  p.getSubtree = getSubtree;
  function getSubtree(ast) {
    return ast[1];
  }

  p.toString = toString;
  function toString() {
    var ast = parser.parse('');
    this.render(this.getSubtree(ast));
    return this.generateCode(ast);
  }
})(AstCollector.prototype);
