modulr
======

Resolves and concatenates [CommonJS module][1] dependencies for use in the browser. It's a port of [`modulr`][2] from Ruby to [node.js][3] and is based on [`module-grapher`][4], a node module which resolves dependencies through recursive static analysis.

Install
-------

`modulr` is available as an NPM module.

    $ npm install modulr

Usage
-----

`modulr` accepts the main module's identifier and an optional config object as arguments which get passed to `module-grapher`. It returns a result object whose `output` property is a string containing [a small runtime][5] and the concatenated modules sources. Optionally, this output can be minified and the module identifiers resolved server-side.

```javascript
require('modulr').build('foo', {
  paths: ['./lib', './vendor'], // defaults to ['.']
  root: 'path/to/package/root/' // defaults to process.cwd()
  minify: true,                 // defaults to false
  resolveIdentifiers: true,     // defaults to false
  minifyIdentifiers: false,     // defaults to false
  environment: 'prod' // or 'dev', defaults to undefined
}, callback);

// Dump the output to `main.js`.
function callback (err, result) {
  if (err) { throw err; }
  require('fs').writeFileSync('/path/to/main.js', result.output, 'utf8');
}
```

`modulr` can also accepts a [CommonJS package][6] or its `package.json` file as argument. In which case it uses the JSON file's `main` value as entry point, the package's dir as root, and picks the rest of its options from the JSON file's `modulr` namespace.

```javascript
require('modulr').buildFromPackage('path/to/package', callback);
```

Development Environments
------------------------

`modulr` provides a development environment. It is enabled by setting the config option `environment` to `"dev"`:

```javascript
require('modulr').build('foo', { environment: 'dev' }, callback);
```
This does essentially two things.

1. It sets the global variable `__DEV__` to `true`. This allows adding development-only code (e.g. logging) that is completely stripped out of production builds, e.g.:
```javascript
if (__DEV__) { console.log('Module Foo loaded.'); }
```

2. It adds [`sourceURL` comments](http://blog.getfirebug.com/2009/08/11/give-your-eval-a-name-with-sourceurl/) to each modules. Rendering engines that support these (at least Gecko and WebKit) will give original file names and line numbers to thrown errors even though all modules are packaged in a single file.

Minification
------------

`modulr` uses [Uglify](https://github.com/mishoo/UglifyJS/) to optionally minify the output. To enable minification, set the `minify` config option to `true`. To also minify module identifiers, set the `minifyIdentifiers` option to `true`. Note that minification is not compatible with the `"dev"` environment.

```javascript
require('modulr').build('foo', { minify: true }, callback);
```

Lazy evaluation
---------------

[Lazy evaluation](http://calendar.perfplanet.com/2011/lazy-evaluation-of-commonjs-modules/) is a technique which allows delaying parsing and evaluation of modules until they are needed (for example, following a user action) while keeping a synchronous programming model.

To lazy eval modules, pass a list of absolute module IDs in the configuration object.

```javascript
require('modulr').build('foo', {
  lazyEval: ['path/to/module/bar', 'path/to/baz']
}, callback);
```

or in the `package.json` file:

```javascript
{
  "modulr": {
    "lazyEval": ["path/to/bar", "path/to/baz"]
  }
}
```

Resolving identifiers at build time
-----------------------------------

CommonJS module identifiers can be absolute or relative. Relative identifiers are simplify development but have an extra runtime cost: the path to the module's identifier has to be calculated every time the module is required, and a context aware require function has to be created for every module.

In order to avoid that extra cost, `modulr` is able to resolve identifiers at build time which produces modified builds which only contain absolute identifiers and uses a [lighter runtime](https://github.com/tobie/modulr-node/blob/master/assets/modulr.sync.resolved.js). To enable this option, set the `resolveIdentifiers` config option to `true`:

```javascript
require('modulr').build('foo', { resolveIdentifiers: true }, callback);
```

Instrumenting Performance
-------------------------

As applications become increasingly complex, startup time tends to suffer. While `modulr` helps mitigate this through optimizations such as resolving identifiers at build time or lazy evaluation, it's sometimes useful to be able to do some serious auditing and find out which modules slow down startup time.

That's what `modulr`'s instrumentPerformance config option enables. Turn it on like so:

```javascript
require('modulr').build('foo', { instrumentPerformance: true }, callback);
```

This adds a slew of data to the `modulr.perf` object available in the global scope (for example, through the console). This data is of the form:

```javascript
{
  "start": 1334878573462,            // All times are in ms.
  "defineStart": 1334878573462,      //
  "defineEnd": 1334878573464,        //
  "requireMainStart": 1334878573464, //
  "modules": {                       // Object containing all defined modules.
    "foo": {                         //
      "count": 0                     // Module "foo" has not been required yet.
    },                               //
                                     //
    "main": {                        // Module "main" has been required once.
      "count": 1,                    // Evaluation of that module and it's
      "left": 1,                     // dependencies took 16 ms.
      "start": 1334878573464,        // Notice the use of nested sets to
      "right": 4,                    // store initialization order.
      "end": 1334878573480           //
    },                               //
                                     //
    "bar": {                         // Module "bar" has been required twice.
      "count": 2,                    // It was lazy evaluated.
      "left": 2,                     //
      "start": 1334878573466,        //
      "evalStart": 1334878573466,    // Lazy evaluation took 12 ms.
      "evalEnd": 1334878573478,      //
      "right": 3,                    //
      "end": 1334878573480           //
    }                                //
  },                                 //
  "requireMainEnd": 1334878573480,   //
  "end": 1334878573480               //
}
```

To visualize this data, just copy and paste it (or in modern browsers, simply drag and drop the JSON file) onto [this page](http://tobie.github.com/modulr-node/perf.html). You'll get a beautiful waterfall chart of your application's initialization stage thanks to a little bit of [d3.js](http://mbostock.github.com/d3/) magic.

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

