var util = require('util'),
    abstractCollector = require('./abstract-collector'),
    SuperClass = abstractCollector.AbstractCollector,
    _super = SuperClass.prototype,
    uglify = require('uglify-js'),
    processor = uglify.uglify,
    parser = uglify.parser;

var RUNTIME = getRuntimeAst('modulr.sync.js');

exports.getRuntimeAst = getRuntimeAst;
function getRuntimeAst(filename) {
  var src = abstractCollector.getRuntimeSrcCode(filename);
  return toAstBody(parser.parse(src));
}

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
  p.getModuleIdAst = getModuleIdAst;
  function getModuleIdAst(m) {
    return ["string",  m.id];
  }

  p.encloseModule = encloseModule;
  function encloseModule(m) {
    var ast = this.getModuleAst(m);
    return ["function", null, ["require", "exports", "module"], toAstBody(ast)];
  }

  p.defineModule = defineModule;
  function defineModule(m) {
    var args = [this.getModuleIdAst(m), this.encloseModule(m)];
    return getFunctionCallStatementAst("define", args);
  }

  p.defineLazyEvaluatedModule = defineLazyEvaluatedModule;
  function defineLazyEvaluatedModule(m) {
    var ast = this.getModuleAst(m),
        args = [this.getModuleIdAst(m), ["string", this.generateCode(ast)]];

    return getFunctionCallStatementAst("define", args);
  }

  p.beforeRequireCall = beforeRequireCall;
  function beforeRequireCall() {
    var ast = parser.parse('if (__PERF__) { modulr.perf.defineEnd = modulr.perf.requireMainStart = Date.now(); }');
    return toAstBody(ast);
  }

  p.renderRequireCall = renderRequireCall;
  function renderRequireCall(m) {
    return getFunctionCallStatementAst("require", [this.getModuleIdAst(m)]);
  }

  p.afterRequireCall = afterRequireCall;
  function afterRequireCall() {
    var ast = parser.parse('if (__PERF__) { modulr.perf.requireMainEnd = modulr.perf.end = Date.now(); }');
    return toAstBody(ast);
  }

  p.renderRuntime = renderRuntime;
  function renderRuntime() {
    return RUNTIME;
  }

  p.generateCode = generateCode;
  function generateCode(ast) {
    if (this.config.minify) {
      ast = toAstRoot(ast);
      ast = processor.ast_mangle(ast, {
        toplevel: false,
        except: [],
        defines: this.getConstantsAsAstExpressions()
      });
      ast = processor.ast_squeeze(ast);
    } else {
      ast = toAstBody(ast);
      var constants = this.getConstants();
      Object.keys(constants).sort().reverse().forEach(function(k) {
        ast.unshift(getVarAssignmentAst(k, constants[k]));
      });
      ast = toAstRoot(ast);
    }
    return processor.gen_code(ast, {
      inline_script: this.config.inlineSafe,
      beautify: !this.config.minify
    });
  }

  p.getConstantsAsAstExpressions = getConstantsAsAstExpressions;
  function getConstantsAsAstExpressions() {
    var constants = this.getConstants(),
        output = {};
    for (var k in constants) {
      output[k] = expressionToAst(constants[k]);
    }
    return output;
  }

  p.getModuleAst = getModuleAst;
  function getModuleAst(m) {
    var ast;
    if (m.duplicateOf) {
      ast = ["stat",
        ["assign", true,
          ["dot", ["name", "module"], "exports"],
          getFunctionCallAst("require", [this.getModuleIdAst(m.duplicateOf)])
        ]
      ];
    } else {
      ast = m.ast;
    }
    return ast;
  }

  p.toString = toString;
  function toString() {
    var buffer = createAstBuffer();
    this.render(buffer);
    return this.generateCode(buffer.ast);
  }

})(AstCollector.prototype);

exports.expressionToAst = expressionToAst;
function expressionToAst(exp) {
  var ast = parser.parse('(' + JSON.stringify(exp) + ')');
  return toAstBody(ast)[0][1];
}

exports.getVarAssignmentAst = getVarAssignmentAst;
function getVarAssignmentAst(identifier, value) {
  var ast = parser.parse('var ' + identifier + ' = ' + JSON.stringify(value) + ';');
  return toAstBody(ast)[0];
}

exports.getFunctionCallAst = getFunctionCallAst;
function getFunctionCallAst(name, args) {
  return ["call", ["name", name], args];
}

exports.getFunctionCallStatementAst = getFunctionCallStatementAst;
function getFunctionCallStatementAst(name, args) {
  return ["stat", getFunctionCallAst(name, args)];
}

exports.toAstBody = toAstBody;
function toAstBody(ast) {
  // A body of an AST is a plain array. It can be used
  // both as the body of a function and the body of a
  // program.
  if (isAstBody(ast)) {
    // We're all good. This is already a body.
    return ast;
  }

  if (isAstRoot(ast)) {
    // We're dealing with a root. Get it's body.
    return ast[1];
  }
  // Lower level than a body. Convert it to a body by
  // wrapping it into an array.
  return [ast];
}

exports.toAstRoot = toAstRoot;
function toAstRoot(ast) {
  if (isAstRoot(ast)) {
    // Already an AST root.
    return ast;
  }
  if (isAstBody(ast)) {
    // This is a body, wrap it up in a root node.
    return ['toplevel', ast];
  }
  // Lower level than a body. More wrapping up.
  return ['toplevel', [ast]];
}

exports.isAstRoot = isAstRoot;
function isAstRoot(ast) {
  return ast[0] === 'toplevel';
}

exports.isAstBody = isAstBody;
function isAstBody(ast) {
  // AST bodies are the only anonymous nodes.
  return typeof ast[0] === 'object';
}

exports.createAstBuffer = createAstBuffer;
function createAstBuffer() {
  return new AstBuffer();
}

exports.AstBuffer = AstBuffer;
function AstBuffer() {
  this.ast = parser.parse('');
  this.body = toAstBody(this.ast);
}

(function(p) {
  p.push = push;
  function push(items) {
    var body = this.body;
    body.push.apply(body, toAstBody(items));
  }
})(AstBuffer.prototype);