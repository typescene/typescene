# Typescene
Strongly typed front end UI library for use with TypeScript.

## Typescene = Familiar OO + Flexible JS
* Object-oriented UI components, just like on the desktop.
* Convenient JavaScript-isms to keep things fast and DRY.
* TypeScript 2.0 for top-notch type checks and IDE autocomplete.
* CSS styling fully compatible with Bootstrap 3 / 4.
* A sensible opt-in multi-tier architecture.

### Philosophy
The Typescene UI toolkit was made to strike a delicate balance that so far no existing framework has struck, in our opinion:

* *The "view" or presentation layer should not determine how the rest of the application is structured*. Some applications need a completely different architecture than others at their core, even though they look alike from a user perspective. In other words, we don't need a "framework", but a progressive "**toolkit**".

* When writing an application, you need a set of solid components that you can use and recombine to form your UI. A window, an input field, a button, etc. *You shouldn't have to think about how these are drawn on screen*, nor about what HTML tags they represent, or how CSS is applied. Typescene provides a familiar set of **object-oriented UI components**.

* JavaScript is wonderful, and TypeScript is even more awesome. The compiler and editor can provide you with a ton of information about your code (or someone else's). That is, unless you have a `.js` file, an `.html` file, and a `.css` file for every component you create... With Typescene, just as with traditional desktop UI development, *code is everything, and everything is code*.

## Documentation

All documentation for the Typescene toolkit is still being written and is very rudimentary. The end goal is to publish a full website with samples, documentation, and reference material.

## Which Package Do I Install?
This package combines specific stable versions of all modules, and includes a minified Javascript output file that can be used for (production) deployments without Webpack/Browserify.

If you want the latest version of everything, use e.g. `typescene-async` and/or `typescene-ui` independently, especially if you are using Webpack for your own project. If you want convenience and a more stable set of features (or just want the `.min.js` file), use `typescene` in your `package.json` file. Requiring all packages at the same time generally does *not* work.

To install the complete Typescene module (including the minified production JS file in `node_modules/typescene/typescene.min.js`):

```
npm install --save typescene
``` 
