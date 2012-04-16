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
  p._constants = null;

  p.setConstants = setConstants;
  function setConstants(constants) {
    this._constants = constants;
  }

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

  p.getConstants = getConstants;
  function getConstants() {
    return (this._constants = this._constants || {});
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
    var modules = this.getModules();

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
      if (m.duplicateOf) {
        // would be pointless to lazy eval these modules.
        buffer.push(this.defineModule(m));
      } else if (m.id in lazyEval) {
        buffer.push(this.defineLazyEvaluatedModule(m));
      } else {
        buffer.push(this.defineModule(m));
      }
    }, this);

    buffer.push(this.beforeRequireCall());
    buffer.push(this.renderRequireCall(this._main));
    buffer.push(this.afterRequireCall());
  }
})(AbstractCollector.prototype);

exports.getRuntimeSrcCode = getRuntimeSrcCode;
function getRuntimeSrcCode(filename) {
  var p = path.join(__dirname, '..', 'assets', filename);
  return fs.readFileSync(p, 'utf8');
}