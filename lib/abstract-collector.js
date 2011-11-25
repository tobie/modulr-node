var fs = require('fs'),
    path = require('path');

exports.AbstractCollector = AbstractCollector;
function AbstractCollector(config) {
  this.config = config;
}

(function(p) {
  p._main = null;
  p._modules = null;
  p._lazyEvaluatedModules = null;

  p.setModules = setModules;
  function setModules(modules) {
    this._modules = modules;
  }

  p.setLazyEvaluatedModules = setLazyEvaluatedModules;
  function setLazyEvaluatedModules(modules) {
    this._lazyEvaluatedModules = modules;
  }

  p.addMainModule = addMainModule;
  function addMainModule(m) {
    this._main = m;
  }

  p.getModules = getModules;
  function getModules() {
    return (this._modules = this._modules || {});
  }

  p.getLazyEvaluatedModules = getLazyEvaluatedModules;
  function getLazyEvaluatedModules() {
    return (this._lazyEvaluatedModules = this._lazyEvaluatedModules || {});
  }

  p.render = render;
  function render(buffer) {
    var modules = this._modules;

    buffer.push(this.renderRuntime());

    // convert to array for sorting.
    var arr = [];
    for (id in modules) {
      arr.push(modules[id]);
    }

    arr.sort(function(a, b) {
      return a.getSize() - b.getSize();
    });

    var lazyEval = this.getLazyEvaluatedModules();
    arr.forEach(function(m) {
      var src;
      if (m.duplicateOf) {
        // would be pointless to lazy eval these modules.
        src = this.encloseModule(m);
      } else if (m.id in lazyEval) {
        src = this.escapeModule(m);
      } else {
        src = this.encloseModule(m);
      }
      buffer.push(this.makeDefine(m, src));
    }, this);

    buffer.push(this.renderRequireCall(this._main));
  }
})(AbstractCollector.prototype);

exports.getRuntimeSrcCode = getRuntimeSrcCode;
function getRuntimeSrcCode(filename) {
  var p = path.join(__dirname, '..', 'assets', filename);
  return fs.readFileSync(p, 'utf8');
}