# Typescene
Typescene is a strongly typed GUI toolkit for Web applications written in TypeScript.

Learn more about Typescene at [typescene.org](http://typescene.org), and follow [@typescene](https://twitter.com/typescene) on twitter.

The docs can be found at [docs.typescene.org](http://docs.typescene.org/).

## Building from source

This repository is organized as a self-organizing 'monorepo', and uses a simple `prebuild` script to manage internal dependencies.

Use the following commands to manage builds:

* `npm install`: this installs all development dependencies from NPM.
* `npm run clean`: this removes all build artifacts.
* `npm run build`: this prepares the `dist/` directory with NPM packages, builds all modules, generates the `.min.js` file in the DOM module, and updates the documentation in the `docs/` folder.
* `npm run generate-docs`: this creates and compiles the documentation (including docs viewer) in the `docs/` folder. Requires all modules to have been built already.
* `npm run update-docs`: this just updates the documentation in the `docs/` folder, e.g. after making a change in any of the `*.md` documentation files. Requires all modules to have been built already.

> Note: `npm run build` will re-generate NPM package directories and files, copying the version number and publish configuration (i.e. NPM dist-tag) from the root `package.json` file. The files in `dist/` should _not_ be changed or checked in -- use the root package file instead.

The root package itself is never published. Only the packages in the `dist/` directory are public.

The files in `docs/` are hosted on GitHub pages and end up on the [docs.typescene.org](http://docs.typescene.org/) domain.
