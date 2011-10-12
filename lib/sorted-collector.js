var util = require('util'),
    SuperClass = require('./collector').Collector,
    _super = SuperClass.prototype;

exports.createSortedCollector = createSortedCollector;
exports.create = createSortedCollector;
function createSortedCollector(config) {
  return new SortedCollector(config);
}

exports.SortedCollector = SortedCollector;
function SortedCollector(config) {
  SuperClass.call(this, config);
}

util.inherits(SortedCollector, SuperClass);

(function(p) {
  function _sortById(a, b) {
    return a.id > b.id ? 1 : -1;
  }
  
  p.toString = toString;
  function toString() {
    this._modules.sort(_sortById);
    this._lazyEvaledModules.sort(_sortById);
    return _super.toString.call(this);
  }
})(SortedCollector.prototype);

