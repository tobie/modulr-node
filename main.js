var fs = require('fs'),
    path = require('path'),
    jsonFs = require('./lib/json-fs'),
    builder = require('./lib/builder'),
    logger = require('./lib/logger'),
    moduleGrapher = require('module-grapher');

exports.build = build;
function build(main, config, callback) {
  if (!callback) {
    callback = config;
    config = {};
  }
  if ((config.minify || config.minifyIdentifiers) && config.cache) {
    var err = new Error('Cannot minify code when using cache.');
    callback(err);
    return;
  }
  if (config.resolveIdentifiers && config.cache) {
    var err = new Error('Cannot resolve identifiers when using cache.');
    callback(err);
    return;
  }
  moduleGrapher.graph(main, config, function(err, result) {
    if (err) {
      callback(err);
    } else {
      result.output = builder.create(config).build(result);
      if (config.verbose) { logger.log(result); }
      callback(null, result);
    }
  });
}

exports.buildFromPackage = function(p, configCallback, callback) {
  if (!callback) {
    callback = configCallback;
    configCallback = function() {};
  }
  fs.stat(p, function(err, stat) {
    if (err) {
      callback(err);
    } else {
      var packageFile, root;
      if (stat.isDirectory()) {
        root = p;
        packageFile = path.join(p, 'package.json');
      } else {
        root = path.dirname(p);
        packageFile = p;
      }
      jsonFs.readFile(packageFile, function(err, json) {
        if (err) {
          err.file = packageFile;
          err.longDesc = err.toString() + '. Malformed JSON in descriptor file:\n    ' + packageFile;
          err.toString = function() { return err.longDesc; };
          callback(err);
        } else {
          var config = json.modulr || {};
          config.isPackageAware = true;
          config.root = root;
          configCallback(config);
          build(json.main, config, callback);
        }
      });
    }
  });
};
