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
  p.defineModule = defineModule;
  function defineModule(m) {
    if (m.indexModule) {
      return SuperClass.prototype.defineModule.call(this, m);
    }
    var body = this.getModuleSrc(m) + this.getSourceUrl(m),
        id = this.getModuleId(m),
        program = 'define("' + id + '", function(require, exports, module) { ' + body +  '});',
        header = this.getCommentHeader(m);

    return header + 'eval("' + this.escape(program, this.config.inlineSafe) + '");\n'
  }
})(DevCollector.prototype);

