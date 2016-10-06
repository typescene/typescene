# typescene
Strongly typed front end library for use with Typescript.

Work-in-progress. Send me an email or stay tuned if you are interested.

## Which Package Do I Use?
This package combines specific stable versions of `typescene-async` and `typescene-ui`, and includes a minified Javascript output file that can be used for (production) deployments without Webpack/Browserify.

If you want the latest version of everything, use `typescene-async` and/or `typescene-ui` independently. If you want convenience and a more stable set of features (or just want the `.min.js` file), use `typescene` in your `package.json` file. Requiring all packages at the same time generally does *not* work.
