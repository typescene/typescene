# typescene
Strongly typed front end library for use with Typescript.

Work-in-progress. Send me an email or stay tuned if you are interested.

## Documentation

Note: all documentation is still being written and is very rudimentary. The end goal is to publish a separate website with samples, documentation, and reference material.

* For documentation on the UI toolkit, refer to the [typescene-ui](https://github.com/typescene/typescene-ui) repository.
* For documentation on the Async base module, which exports e.g. promises, signals, observable values, arrays, and objects, refer to the [typescene-async](https://github.com/typescene/typescene-async) repository. This is useful if you wish to read more about the underpinnings of the UI module, or work with the exported asynchronous constructs yourself.

## Which Package Do I Install?
This package combines specific stable versions of `typescene-async` and `typescene-ui`, and includes a minified Javascript output file that can be used for (production) deployments without Webpack/Browserify.

If you want the latest version of everything, use `typescene-async` and/or `typescene-ui` independently, especially if you are using Webpack for your own project. If you want convenience and a more stable set of features (or just want the `.min.js` file), use `typescene` in your `package.json` file. Requiring all packages at the same time generally does *not* work.
