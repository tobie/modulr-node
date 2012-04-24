var modulr = require('../main');
var path = require('path');

module.exports = {
  testSanity: function(test) {
    var packagePath = path.join(__dirname, 'sanity');
    modulr.buildFromPackage(packagePath, function(err, result) {
      test.ok(!err);
      if (err) {
        console.error(err.stack);
      }

      test.ok(result.modules);
      test.ok(result.modules.sanity);
      test.ok(result.output);

      test.equal(result.main, 'sanity');

      test.ok(/SANITY/.test(result.output));

      test.deepEqual(result.modules.sanity.getDependencies(), {});
      test.done();
    });
  },

  testRelativeRequires: function(test) {
    var packagePath = path.join(__dirname, 'relative_requires');
    modulr.buildFromPackage(packagePath, function(err, result) {
      test.ok(!err);
      if (err) {
        console.error(err.stack);
      }

      test.equal(result.main, 'relative_requires');

      test.ok(/FOO/.test(result.output));
      test.ok(/BAR/.test(result.output));
      test.ok(/BAZ/.test(result.output));

      var mainDeps = Object.keys(result.main.getDirectDependencies());
      mainDeps.sort();

      test.deepEqual(mainDeps, ['lib/bar', 'lib/foo']);

      var barModule = result.modules['lib/bar'];
      var barDeps = Object.keys(barModule.getDirectDependencies());

      test.deepEqual(barDeps, ['baz']);
      test.done();
    });
  },

  testPaths: function(test) {
    var packagePath = path.join(__dirname, 'paths');
    modulr.buildFromPackage(packagePath, function(err, result) {
      test.ok(!err);
      if (err) {
        console.error(err.stack);
      }

      test.equal(result.main, 'paths');

      test.ok(/FOO/.test(result.output));
      test.ok(/BAR/.test(result.output));
      test.ok(/BAZ/.test(result.output));

      var mainDeps = Object.keys(result.main.getDirectDependencies());
      mainDeps.sort();

      test.deepEqual(mainDeps, ['bar', 'foo']);

      var barDeps = Object.keys(result.modules.bar.getDirectDependencies());

      test.deepEqual(barDeps, ['baz']);
      test.done();
    });
  }
};
