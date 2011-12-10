modulr
======

Resolves and concatenates [CommonJS module][1] dependencies for use in the browser. It's a port of [`modulr`][2] from Ruby to [node.js][3] and is based on [`module-grapher`][4], a node module which resolves dependencies through recursive static analysis.

Install
-------

`modulr` is available as an NPM module.

    $ npm install modulr

Usage
-----

`modulr` accepts the main module's identifier and an optional config object as arguments which get passed to `module-grapher`. It outputs [a small runtime][5] and the concatenated modules sources as a string.

```javascript
require('modulr').build('foo', {
  paths: ['./lib', './vendor'], // defaults to the equivalent of ['.']
  root: 'path/to/package/root/' // defaults to process.cwd()
}, callback);
```

`modulr` can also accepts a [CommonJS package][6] or its `package.json` file as argument. I which case it uses the JSON file's `main` value as entry point, the package's dir as root, and picks the rest of its options from the JSON file's `modulr` namespace.

```javascript
require('modulr').buildFromPackage('path/to/package', callback);
```

Tests
-----

Tests are run using [nodeunit][9]. Once nodeunit is installed, from the root 
directory, run

    $ nodeunit test

License
-------

Your choice of [MIT or Apache, Version 2.0 licenses][7]. `modulr` is copyright 2010 [Tobie Langel][8].

[1]: http://wiki.commonjs.org/wiki/Modules/1.1
[2]: https://github.com/tobie/modulr
[3]: http://nodejs.org
[4]: https://github.com/tobie/module-grapher
[5]: https://github.com/tobie/modulr-node/blob/master/assets/modulr.sync.js
[6]: http://wiki.commonjs.org/wiki/Packages/1.1
[7]: https://raw.github.com/tobie/modulr-node/master/LICENSE
[8]: http://tobielangel.com
[9]: https://github.com/caolan/nodeunit
