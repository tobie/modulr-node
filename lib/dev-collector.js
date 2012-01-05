var util = require('util'),
    collector = require('./collector'),
    SuperClass = collector.Collector,
    _super = SuperClass.prototype;

exports.createDevCollector = createDevCollector;
exports.create = createDevCollector;
function createDevCollector(config) {
  return new DevCollector(config);
}

exports.DevCollector = DevCollector;
function DevCollector(config) {
  SuperClass.call(this, config);
}

util.inherits(DevCollector, SuperClass);

(function(p) {
  p.encloseModule = encloseModule;
  function encloseModule(m) {
    return 'new Function("require", "exports", "module", ' + this.escapeModule(m) + ')';
  }
})(DevCollector.prototype);

