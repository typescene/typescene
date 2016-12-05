# Typescene
Strongly typed front end library for use with TypeScript.

## Documentation

All documentation for the Typescene toolkit is still being written and is very rudimentary. The end goal is to publish a full website with samples, documentation, and reference material.

* For documentation on the UI toolkit, refer to the [typescene-ui](https://github.com/typescene/typescene-ui) repository.
* For documentation on the Async library, which exports e.g. promises, signals, observable values, arrays, and objects, refer to the [typescene-async](https://github.com/typescene/typescene-async) repository. This is useful if you wish to read more about the underpinnings of the UI module, or work with asynchronous constructs yourself.

## Which Package Do I Install?
This package combines specific stable versions of `typescene-async` and `typescene-ui`, and includes a minified Javascript output file that can be used for (production) deployments without Webpack/Browserify.

If you want the latest version of everything, use `typescene-async` and/or `typescene-ui` independently, especially if you are using Webpack for your own project. If you want convenience and a more stable set of features (or just want the `.min.js` file), use `typescene` in your `package.json` file. Requiring all packages at the same time generally does *not* work.

To install the complete Typescene module (including the minified production JS file in `node_modules/typescene/typescene.min.js`):

```
npm install --save typescene
``` 

To install the UI toolkit separately (which in turn depends on the Async library):

```
npm install --save typescene-ui
```
