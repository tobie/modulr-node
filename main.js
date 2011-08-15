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
    err ? callback(err) : builder.create(config).build(result, callback);
  });
}

exports.buildFromPackage = function(p, callback) {
  fs.stat(p, function(err, stat) {
    if (err) {
      callback(err);
    } else {
      var packageFile, root;
      if (stat.isDirectory()) {
        root = p;
        packageFile = path.join(root, 'package.json');
      } else {
        root = path.rootname(p);
        packageFile = p;
      }
      jsonFs.readFile(packageFile, function(err, json) {
        if (err) {
          callback(err);
        } else {
          var paths = [];
          if (json.builder_paths) {
            paths.push.apply(paths, json.builder_paths);
          }
          paths.push('.');
          build(json.main, { paths: paths, root: root }, callback);
        }
      });
    }
  });
}