exports.log = log;
function log(result) {
  console.log('Successfully resolved dependencies for module "'+ result.main + '".');

  var d = result.resolvedAt - result.instantiatedAt;
  console.log('This took ' + d + 'ms.');

  var modCountText = 'Found ' + result.getModuleCount() + ' module(s)';
  if (result.getPackageCount) {
    console.log(modCountText + ' and '+ result.getPackageCount() + ' package(s).');
  } else {
    console.log(modCountText + '.');
  }

  if (result.lazyEval) {
    var modules = Object.keys(result.lazyEval).sort().join(', ');
    console.log('The following modules will be lazy-evaled: ' + modules + '.');
  }

  var size = sizeString(result.getSize());
  console.log('The total size is ' + size + ' unminified.');

  var loc = locString(result.getLoc());
  var sloc = locString(result.getSloc());
  console.log('There are ' + loc + '-LOC and ' + sloc + '-SLOC.');
}

var _KiB = 1024;
var _MiB = 1024 * 1024;
function sizeString(size) {
  var displaySize = size;
  var suffix = 'B';
  if (size > _KiB) {
    if (size > 10 * _KiB) {
      displaySize = Math.round(size / _KiB);
    } else {
      displaySize = Math.round(10 * size / _KiB) / 10;
    }
    suffix = 'K';
  }
  if (size > _MiB) {
    if (size > 10 * _MiB) {
      displaySize = Math.round(size / _MiB);
    } else {
      displaySize = Math.round(10 * size / _MiB) / 10;
    }
    suffix = 'M';
  }
  return displaySize + suffix;
}

var _KLOC = 1000;
var _MLOC = 1000 * 1000;
function locString(loc) {
  var displayLoc = loc;
  var suffix = '';
  if (loc > _KLOC) {
    if (loc > 10 * _KLOC) {
      displayLoc = Math.round(loc / _KLOC);
    } else {
      displayLoc = Math.round(10 * loc / _KLOC) / 10;
    }
    suffix = 'K';
  }
  if (loc > _MLOC) {
    if (loc > 10 * _MLOC) {
      displayLoc = Math.round(loc / _MLOC);
    } else {
      displayLoc = Math.round(10 * loc / _MLOC) / 10;
    }
    suffix = 'M';
  }
  return displayLoc + suffix;
}
