var fs = require('fs'),
    path = require('path'),
    jsonFs = require('./lib/json-fs'),
    builder = require('./lib/builder'),
    moduleGrapher = require('module-grapher');

exports.build = build;
function build(main, config, callback) {
  if (!callback) {
    callback = config;
    config = {};
  }
  moduleGrapher.graph(main, config, function(err, result) {
    if (err) {
      callback(err)
    } else {
      builder.create(config).build(result, function(err, output) {
        if (config.verbose) {
          log(result);
        }
        callback(err, output);
      });
    }
  });
}

exports.buildFromPackage = function(p, config, callback) {
  if (!callback) {
    callback = config;
    config = {};
  }

  fs.stat(p, function(err, stat) {
    if (err) {
      callback(err);
    } else {
      var packageFile;
      if (stat.isDirectory()) {
        config.root = p;
        packageFile = path.join(p, 'package.json');
      } else {
        config.root = path.rootname(p);
        packageFile = p;
      }
      jsonFs.readFile(packageFile, function(err, json) {
        // get package-specific config options
        var modulrConfig = json.modulr || {};
        if (err) {
          callback(err);
        } else {
          var paths = modulrConfig.paths ? modulrConfig.paths : [];
          // we may want to include additional paths that are dynamic at build time
          if (config.paths) {
            config.paths = config.paths.concat(paths);
          } else {
            config.paths = paths;
          }
          config.paths.push('.');

          if (config.lazyEval === undefined) {
            config.lazyEval = !!modulrConfig.lazy_eval;
          }
          config.isPackageAware = true;
          if (config.verbose === undefined)  {
            config.verbose = !!modulrConfig.verbose;
          }

          build(json.main, config, callback);
        }
      });
    }
  });
}

function log(result) {
  console.log('Successfully resolved dependencies for module "'+ result.main + '".');

  var d = result.resolvedAt - result.instantiatedAt;
  console.log('This took ' + d + ' ms.');

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

  var size = Math.round((result.getSize() / 1024) * 10) / 10;
  console.log('The total size is ' + size + ' kb unminified.');

  console.log('There are', result.getLoc(), 'LOC and', result.getSloc(), 'SLOC.');
}